import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, FileText, Shield, Building2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/constants";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, profile, userRole, loading, isAdmin, isBusinessOwner, isInvestor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch wallet and balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["dashboard-wallet", user?.id],
    queryFn: async () => {
      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .single();

      if (walletError) throw walletError;

      // Get balance using RPC function
      const { data: balance } = await supabase.rpc("get_wallet_balance", {
        _wallet_id: wallet.id
      });

      return { wallet, balance: Number(balance) || 0 };
    },
    enabled: !!user,
  });

  // Fetch investments summary
  const { data: investmentData, isLoading: investmentLoading } = useQuery({
    queryKey: ["dashboard-investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("units, total_amount, status")
        .eq("investor_user_id", user!.id)
        .is("deleted_at", null);

      if (error) throw error;

      const totalInvested = data.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
      const activeUnits = data
        .filter(inv => inv.status === "active")
        .reduce((sum, inv) => sum + inv.units, 0);

      return { totalInvested, activeUnits, investmentCount: data.length };
    },
    enabled: !!user,
  });

  // Fetch profit distributions for the user
  const { data: profitData, isLoading: profitLoading } = useQuery({
    queryKey: ["dashboard-profits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profit_distribution_entries")
        .select("amount")
        .eq("investor_user_id", user!.id);

      if (error) throw error;

      const totalProfit = data.reduce((sum, entry) => sum + Number(entry.amount), 0);
      return { totalProfit };
    },
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = userRole?.role?.replace("_", " ") || "Investor";
  const kycStatus = profile?.kyc_status || "pending";
  const isKycVerified = profile?.kyc_status === "verified";
  const isDataLoading = walletLoading || investmentLoading || profitLoading;

  return (
    <DashboardLayout 
      title={`Welcome back, ${profile?.full_name || "User"}!`}
      subtitle={`Role: ${roleLabel} · KYC: ${kycStatus}`}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isDataLoading ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : (
          <>
            <StatCard icon={<Wallet />} label="Wallet Balance" value={formatCurrency(walletData?.balance || 0)} />
            <StatCard icon={<TrendingUp />} label="Total Invested" value={formatCurrency(investmentData?.totalInvested || 0)} />
            <StatCard icon={<Building2 />} label="Active Units" value={formatNumber(investmentData?.activeUnits || 0)} />
            <StatCard icon={<TrendingUp />} label="Total Profit" value={formatCurrency(profitData?.totalProfit || 0)} />
          </>
        )}
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link to="/businesses">
            <Button variant="gradient">Browse Businesses</Button>
          </Link>
          {isInvestor && (
            <>
              <Link to="/dashboard/investments">
                <Button variant="outline">My Investments</Button>
              </Link>
              <Link to="/dashboard/transactions">
                <Button variant="outline">View Transactions</Button>
              </Link>
            </>
          )}
          {isBusinessOwner && (
            <Link to="/dashboard/my-business">
              <Button variant="outline">Manage Business</Button>
            </Link>
          )}
          {isAdmin && (
            <Link to="/dashboard/admin/users">
              <Button variant="secondary">Admin Panel</Button>
            </Link>
          )}
          {!isKycVerified && (
            <Button variant="secondary">Complete KYC</Button>
          )}
        </CardContent>
      </Card>

      {/* Role-specific info */}
      {isAdmin && (
        <Card className="mt-6 border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You have administrative privileges. Manage users, approve businesses, and oversee platform operations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/admin/users">
                <Button variant="outline" size="sm">Manage Users</Button>
              </Link>
              <Link to="/dashboard/admin/businesses">
                <Button variant="outline" size="sm">Manage Businesses</Button>
              </Link>
              <Link to="/dashboard/admin/settings">
                <Button variant="outline" size="sm">Platform Settings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
