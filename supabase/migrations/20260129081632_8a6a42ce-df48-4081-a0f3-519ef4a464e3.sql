-- Atomic profit/loss distribution function
-- Calculates variable per-unit returns (can be positive profit or negative loss)
-- Shariah-compliant: No guaranteed returns, actual profit/loss sharing

CREATE OR REPLACE FUNCTION public.process_profit_distribution_atomic(
  p_profit_distribution_id UUID,
  p_admin_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_distribution RECORD;
  v_business RECORD;
  v_investment RECORD;
  v_total_units_invested INTEGER;
  v_per_unit_amount NUMERIC(15, 4);
  v_investor_amount NUMERIC(15, 2);
  v_investor_wallet_id UUID;
  v_entry_id UUID;
  v_entries_created INTEGER := 0;
  v_total_distributed NUMERIC(15, 2) := 0;
  v_is_loss BOOLEAN;
  v_description TEXT;
BEGIN
  -- Verify admin permission
  IF NOT is_admin(p_admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can process profit distributions';
  END IF;

  -- Lock and get the profit distribution record
  SELECT pd.*, bp.business_name, bp.units_sold
  INTO v_distribution
  FROM profit_distributions pd
  JOIN business_profiles bp ON bp.id = pd.business_profile_id
  WHERE pd.id = p_profit_distribution_id
    AND pd.deleted_at IS NULL
  FOR UPDATE;

  IF v_distribution IS NULL THEN
    RAISE EXCEPTION 'Profit distribution not found';
  END IF;

  IF v_distribution.status != 'pending' THEN
    RAISE EXCEPTION 'Distribution already processed or in progress. Current status: %', v_distribution.status;
  END IF;

  -- Mark as processing to prevent concurrent execution
  UPDATE profit_distributions
  SET status = 'processing', updated_at = now()
  WHERE id = p_profit_distribution_id;

  -- Get total units invested in this business (from active investments)
  SELECT COALESCE(SUM(units), 0) INTO v_total_units_invested
  FROM investments
  WHERE business_profile_id = v_distribution.business_profile_id
    AND status = 'active'
    AND deleted_at IS NULL;

  IF v_total_units_invested = 0 THEN
    RAISE EXCEPTION 'No active investments found for this business';
  END IF;

  -- Calculate per-unit amount (can be positive or negative)
  -- total_profit_amount can be negative for losses
  v_per_unit_amount := v_distribution.total_profit_amount / v_total_units_invested;
  v_is_loss := v_distribution.total_profit_amount < 0;

  -- Process each active investment
  FOR v_investment IN
    SELECT i.id, i.investor_user_id, i.units
    FROM investments i
    WHERE i.business_profile_id = v_distribution.business_profile_id
      AND i.status = 'active'
      AND i.deleted_at IS NULL
    ORDER BY i.created_at
  LOOP
    -- Calculate this investor's share (rounded to 2 decimal places)
    v_investor_amount := ROUND(v_investment.units * v_per_unit_amount, 2);
    
    -- Get investor's wallet
    SELECT id INTO v_investor_wallet_id
    FROM wallets
    WHERE user_id = v_investment.investor_user_id
      AND deleted_at IS NULL;

    IF v_investor_wallet_id IS NULL THEN
      RAISE EXCEPTION 'Wallet not found for investor %', v_investment.investor_user_id;
    END IF;

    -- Build description based on profit or loss
    IF v_is_loss THEN
      v_description := 'Loss share from ' || v_distribution.business_name || 
                       ' - ' || v_distribution.cycle_name || 
                       ' (' || v_investment.units || ' units)';
    ELSE
      v_description := 'Profit share from ' || v_distribution.business_name || 
                       ' - ' || v_distribution.cycle_name || 
                       ' (' || v_investment.units || ' units)';
    END IF;

    -- Create profit distribution entry record
    INSERT INTO profit_distribution_entries (
      profit_distribution_id,
      investment_id,
      investor_user_id,
      units,
      amount
    ) VALUES (
      p_profit_distribution_id,
      v_investment.id,
      v_investment.investor_user_id,
      v_investment.units,
      v_investor_amount
    )
    RETURNING id INTO v_entry_id;

    -- Create ledger entry (positive for profit, negative for loss)
    INSERT INTO ledger_entries (
      wallet_id,
      entry_type,
      amount,
      description,
      reference_id,
      reference_type,
      created_by
    ) VALUES (
      v_investor_wallet_id,
      'profit_distribution',
      v_investor_amount,  -- Already signed correctly from calculation
      v_description,
      v_entry_id,
      'profit_distribution_entry',
      p_admin_user_id
    );

    v_entries_created := v_entries_created + 1;
    v_total_distributed := v_total_distributed + v_investor_amount;
  END LOOP;

  -- Mark distribution as completed
  UPDATE profit_distributions
  SET 
    status = 'completed',
    processed_at = now(),
    processed_by = p_admin_user_id,
    updated_at = now()
  WHERE id = p_profit_distribution_id;

  -- Return summary
  RETURN json_build_object(
    'success', true,
    'distribution_id', p_profit_distribution_id,
    'business_name', v_distribution.business_name,
    'cycle_name', v_distribution.cycle_name,
    'total_amount', v_distribution.total_profit_amount,
    'is_loss', v_is_loss,
    'per_unit_amount', ROUND(v_per_unit_amount, 2),
    'total_units', v_total_units_invested,
    'investors_credited', v_entries_created,
    'total_distributed', v_total_distributed
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback status if we set it to processing
    UPDATE profit_distributions
    SET status = 'pending', updated_at = now()
    WHERE id = p_profit_distribution_id
      AND status = 'processing';
    RAISE;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_profit_distribution_atomic(UUID, UUID) TO authenticated;