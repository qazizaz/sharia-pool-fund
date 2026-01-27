import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvestmentRequest {
  business_profile_id: string;
  units: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Parse request body
    const { business_profile_id, units }: InvestmentRequest = await req.json();

    // Validate input
    if (!business_profile_id || !units || units < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid request: business_profile_id and units (>= 1) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for atomic operations
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // ============ STEP 1: Validate KYC Status ============
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("kyc_status")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.kyc_status !== "verified") {
      return new Response(
        JSON.stringify({ error: "KYC verification required before investing" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ STEP 2: Get Business and Validate Units ============
    const { data: business, error: businessError } = await adminClient
      .from("business_profiles")
      .select("id, business_name, unit_price, total_units_offered, units_sold, status")
      .eq("id", business_profile_id)
      .is("deleted_at", null)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (business.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Business is not accepting investments" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const availableUnits = business.total_units_offered - business.units_sold;
    if (units > availableUnits) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient units available. Requested: ${units}, Available: ${availableUnits}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalCost = units * Number(business.unit_price);

    // ============ STEP 3: Get Wallet and Validate Balance ============
    const { data: wallet, error: walletError } = await adminClient
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: "Wallet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current wallet balance
    const { data: balanceData, error: balanceError } = await adminClient
      .rpc("get_wallet_balance", { _wallet_id: wallet.id });

    if (balanceError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch wallet balance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBalance = Number(balanceData) || 0;

    if (currentBalance < totalCost) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient wallet balance. Required: ${totalCost}, Available: ${currentBalance}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ STEP 4: ATOMIC TRANSACTION ============
    // We need to perform these operations atomically:
    // 1. Create investment record
    // 2. Update business units_sold
    // 3. Create ledger entry (debit)
    
    // Since Supabase JS doesn't support multi-statement transactions,
    // we use a database function for true atomicity
    const { data: result, error: txError } = await adminClient.rpc("process_investment_atomic", {
      p_investor_user_id: userId,
      p_business_profile_id: business_profile_id,
      p_units: units,
      p_unit_price: business.unit_price,
      p_total_amount: totalCost,
      p_wallet_id: wallet.id,
      p_current_units_sold: business.units_sold,
      p_business_name: business.business_name,
    });

    if (txError) {
      console.error("Transaction error:", txError);
      return new Response(
        JSON.stringify({ error: txError.message || "Transaction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully invested ${units} units in ${business.business_name}`,
        investment_id: result,
        amount_deducted: totalCost,
        units_purchased: units
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
