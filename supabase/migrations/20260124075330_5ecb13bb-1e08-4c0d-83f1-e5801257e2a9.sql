-- EasyInvest: Shariah-Compliant Investment Platform Database Schema

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'business_owner', 'investor');

-- 2. Create status enums
CREATE TYPE public.kyc_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
CREATE TYPE public.business_status AS ENUM ('pending', 'active', 'funded', 'closed', 'rejected');
CREATE TYPE public.funding_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE public.investment_status AS ENUM ('active', 'redeemed', 'defaulted');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'processed');
CREATE TYPE public.profit_distribution_status AS ENUM ('pending', 'processing', 'completed');
CREATE TYPE public.ledger_entry_type AS ENUM ('investment', 'profit_distribution', 'withdrawal', 'admin_adjustment', 'deposit');

-- 3. User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'investor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cnic TEXT,
    address TEXT,
    kyc_status kyc_status NOT NULL DEFAULT 'pending',
    kyc_submitted_at TIMESTAMPTZ,
    kyc_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 5. Wallets table (balance derived from ledger)
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 6. Ledger entries table (immutable financial records)
CREATE TABLE public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    entry_type ledger_entry_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

-- 7. Business profiles table
CREATE TABLE public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    business_name TEXT NOT NULL,
    description TEXT,
    sector TEXT,
    shariah_compliance_certificate TEXT,
    total_units_offered INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 25000.00,
    units_sold INTEGER NOT NULL DEFAULT 0,
    status business_status NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 8. Funding requests table
CREATE TABLE public.funding_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id),
    requested_units INTEGER NOT NULL,
    requested_amount DECIMAL(15, 2) NOT NULL,
    status funding_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 9. Investments table
CREATE TABLE public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_user_id UUID NOT NULL,
    business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id),
    units INTEGER NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 25000.00,
    total_amount DECIMAL(15, 2) NOT NULL,
    status investment_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 10. Profit distributions table
CREATE TABLE public.profit_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id),
    cycle_name TEXT NOT NULL,
    total_profit_amount DECIMAL(15, 2) NOT NULL,
    distribution_date DATE NOT NULL,
    status profit_distribution_status NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 11. Profit distribution entries (per investor)
CREATE TABLE public.profit_distribution_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profit_distribution_id UUID NOT NULL REFERENCES public.profit_distributions(id),
    investor_user_id UUID NOT NULL,
    investment_id UUID NOT NULL REFERENCES public.investments(id),
    units INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    account_title TEXT,
    status withdrawal_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 13. Admin action logs table (immutable audit trail)
CREATE TABLE public.admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_distribution_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Security definer functions for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_investor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'investor');
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'business_owner');
$$;

CREATE OR REPLACE FUNCTION public.has_kyc_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND kyc_status = 'verified'
      AND deleted_at IS NULL
  );
$$;

-- Function to get wallet balance from ledger
CREATE OR REPLACE FUNCTION public.get_wallet_balance(_wallet_id UUID)
RETURNS DECIMAL(15, 2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::DECIMAL(15, 2)
  FROM public.ledger_entries
  WHERE wallet_id = _wallet_id;
$$;

-- Function to get user's wallet id
CREATE OR REPLACE FUNCTION public.get_user_wallet_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.wallets WHERE user_id = _user_id AND deleted_at IS NULL LIMIT 1;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS Policies for wallets
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create own wallet"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ledger_entries
CREATE POLICY "Users can view own ledger entries"
ON public.ledger_entries FOR SELECT
USING (
  wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Only system/admin can insert ledger entries"
ON public.ledger_entries FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for business_profiles
CREATE POLICY "Anyone can view active businesses"
ON public.business_profiles FOR SELECT
USING (
  (status IN ('active', 'funded') AND deleted_at IS NULL)
  OR owner_user_id = auth.uid()
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Business owners can create profiles"
ON public.business_profiles FOR INSERT
WITH CHECK (
  auth.uid() = owner_user_id
  AND (public.is_business_owner(auth.uid()) OR public.is_admin(auth.uid()))
);

CREATE POLICY "Owners and admins can update business profiles"
ON public.business_profiles FOR UPDATE
USING (owner_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- RLS Policies for funding_requests
CREATE POLICY "View funding requests"
ON public.funding_requests FOR SELECT
USING (
  business_profile_id IN (SELECT id FROM public.business_profiles WHERE owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
  OR public.is_investor(auth.uid())
);

CREATE POLICY "Business owners can create funding requests"
ON public.funding_requests FOR INSERT
WITH CHECK (
  business_profile_id IN (SELECT id FROM public.business_profiles WHERE owner_user_id = auth.uid())
);

CREATE POLICY "Admins can update funding requests"
ON public.funding_requests FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS Policies for investments
CREATE POLICY "Users can view relevant investments"
ON public.investments FOR SELECT
USING (
  investor_user_id = auth.uid()
  OR business_profile_id IN (SELECT id FROM public.business_profiles WHERE owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Investors can create investments"
ON public.investments FOR INSERT
WITH CHECK (
  auth.uid() = investor_user_id
  AND public.is_investor(auth.uid())
);

CREATE POLICY "Admins can update investments"
ON public.investments FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS Policies for profit_distributions
CREATE POLICY "View profit distributions"
ON public.profit_distributions FOR SELECT
USING (
  business_profile_id IN (
    SELECT business_profile_id FROM public.investments WHERE investor_user_id = auth.uid()
  )
  OR business_profile_id IN (SELECT id FROM public.business_profiles WHERE owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Only admins can create profit distributions"
ON public.profit_distributions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update profit distributions"
ON public.profit_distributions FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS Policies for profit_distribution_entries
CREATE POLICY "Investors can view their profit entries"
ON public.profit_distribution_entries FOR SELECT
USING (investor_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update withdrawal requests"
ON public.withdrawal_requests FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_action_logs
CREATE POLICY "Only admins can view action logs"
ON public.admin_action_logs FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert action logs"
ON public.admin_action_logs FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) AND admin_user_id = auth.uid());

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update triggers
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funding_requests_updated_at BEFORE UPDATE ON public.funding_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profit_distributions_updated_at BEFORE UPDATE ON public.profit_distributions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
    
    -- Create wallet
    INSERT INTO public.wallets (user_id)
    VALUES (NEW.id);
    
    -- Assign default investor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'investor');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_ledger_entries_wallet_id ON public.ledger_entries(wallet_id);
CREATE INDEX idx_investments_investor_id ON public.investments(investor_user_id);
CREATE INDEX idx_investments_business_id ON public.investments(business_profile_id);
CREATE INDEX idx_business_profiles_owner_id ON public.business_profiles(owner_user_id);
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_profit_distribution_entries_investor_id ON public.profit_distribution_entries(investor_user_id);