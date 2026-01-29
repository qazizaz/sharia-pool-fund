-- =====================================================
-- SECURITY FIX: Overly Permissive RLS Policies
-- =====================================================

-- 1. Fix ledger_entries INSERT policy
-- The current policy allows ANY authenticated user to insert entries
-- This should only be allowed for admins (service role bypasses RLS)
DROP POLICY IF EXISTS "System and admin can insert ledger entries" ON public.ledger_entries;

CREATE POLICY "Only admins can insert ledger entries" 
ON public.ledger_entries 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- 2. Fix business_profiles UPDATE policy
-- The current policy allows ANY authenticated user to update
-- This should only allow owners and admins
DROP POLICY IF EXISTS "Owners admins and investors can update business profiles" ON public.business_profiles;

CREATE POLICY "Owners and admins can update business profiles" 
ON public.business_profiles 
FOR UPDATE 
USING (owner_user_id = auth.uid() OR is_admin(auth.uid()));

-- =====================================================
-- SECURITY FIX: Unprotected RPC Functions
-- =====================================================

-- 3. Fix get_wallet_balance function to check authorization
-- Users should only be able to query their own wallet or admins can query any
CREATE OR REPLACE FUNCTION public.get_wallet_balance(_wallet_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::DECIMAL(15, 2)
  FROM public.ledger_entries
  WHERE wallet_id = _wallet_id
    AND (
      -- User owns this wallet
      EXISTS (SELECT 1 FROM wallets WHERE id = _wallet_id AND user_id = auth.uid())
      -- Or user is an admin
      OR is_admin(auth.uid())
    );
$$;

-- 4. Fix get_user_wallet_id function to check authorization
-- Users should only be able to get their own wallet ID or admins can query any
CREATE OR REPLACE FUNCTION public.get_user_wallet_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id 
  FROM public.wallets 
  WHERE user_id = _user_id 
    AND deleted_at IS NULL
    AND (
      -- User is querying their own wallet
      _user_id = auth.uid()
      -- Or user is an admin
      OR is_admin(auth.uid())
    )
  LIMIT 1;
$$;