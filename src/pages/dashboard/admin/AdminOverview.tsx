import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Building2, Wallet, TrendingUp, Shield, 
  Activity, AlertTriangle, CheckCircle, Clock, 
  DollarSign, FileText, Eye, ArrowRight
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/constants";

export default function AdminOverview() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  // Platform Statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      // Get all counts in parallel
      const [
        usersResult,
        businessesResult,
        investmentsResult,
        walletsResult,
        withdrawalsResult,
        ledgerResult,
        rolesResult
      ] = await Promise.all([
        supabase.from("profiles").select("id, kyc_status, created_at", { count: "exact" }).is("deleted_at", null),
        supabase.from("business_profiles").select("id, status, units_sold, unit_price, total_units_offered", { count: "exact" }).is("deleted_at", null),
        supabase.from("investments").select("id, total_amount, units, status, created_at", { count: "exact" }).is("deleted_at", null),
        supabase.from("wallets").select("id").is("deleted_at", null),
        supabase.from("withdrawal_requests").select("id, amount, status", { count: "exact" }).is("deleted_at", null),
        supabase.from("ledger_entries").select("id, amount, entry_type, created_at"),
        supabase.from("user_roles").select("id, role")
      ]);

      const users = usersResult.data || [];
      const businesses = businessesResult.data || [];
      const investments = investmentsResult.data || [];
      const withdrawals = withdrawalsResult.data || [];
      const ledger = ledgerResult.data || [];
      const roles = rolesResult.data || [];

      // Calculate metrics
      const totalUsers = users.length;
      const kycPending = users.filter(u => u.kyc_status === "pending").length;
      const kycSubmitted = users.filter(u => u.kyc_status === "submitted").length;
      const kycVerified = users.filter(u => u.kyc_status === "verified").length;

      const totalBusinesses = businesses.length;
      const pendingBusinesses = businesses.filter(b => b.status === "pending").length;
      const activeBusinesses = businesses.filter(b => b.status === "active").length;
      const fundedBusinesses = businesses.filter(b => b.status === "funded").length;

      const totalInvestments = investments.length;
      const totalInvestedAmount = investments.reduce((sum, i) => sum + Number(i.total_amount), 0);
      const totalUnitsSold = investments.reduce((sum, i) => sum + i.units, 0);

      const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
      const pendingWithdrawalAmount = withdrawals
        .filter(w => w.status === "pending")
        .reduce((sum, w) => sum + Number(w.amount), 0);

      const totalDeposits = ledger
        .filter(e => e.entry_type === "deposit" && e.amount > 0)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const totalWithdrawn = ledger
        .filter(e => e.entry_type === "withdrawal" && e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

      const totalProfitDistributed = ledger
        .filter(e => e.entry_type === "profit_distribution" && e.amount > 0)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const adminCount = roles.filter(r => r.role === "admin").length;
      const investorCount = roles.filter(r => r.role === "investor").length;
      const businessOwnerCount = roles.filter(r => r.role === "business_owner").length;

      return {
        totalUsers,
        kycPending,
        kycSubmitted,
        kycVerified,
        totalBusinesses,
        pendingBusinesses,
        activeBusinesses,
        fundedBusinesses,
        totalInvestments,
        totalInvestedAmount,
        totalUnitsSold,
        pendingWithdrawals,
        pendingWithdrawalAmount,
        totalDeposits,
        totalWithdrawn,
        totalProfitDistributed,
        adminCount,
        investorCount,
        businessOwnerCount,
      };
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Recent Activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const [investmentsRes, withdrawalsRes, businessesRes, usersRes] = await Promise.all([
        supabase.from("investments")
          .select("id, total_amount, units, created_at, business_profile_id")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("withdrawal_requests")
          .select("id, amount, status, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("business_profiles")
          .select("id, business_name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("profiles")
          .select("id, full_name, email, created_at, kyc_status")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      return {
        recentInvestments: investmentsRes.data || [],
        recentWithdrawals: withdrawalsRes.data || [],
        recentBusinesses: businessesRes.data || [],
        recentUsers: usersRes.data || [],
      };
    },
    enabled: !!user && isAdmin,
  });

  // Pending Actions
  const { data: pendingActions, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-actions"],
    queryFn: async () => {
      const [kycPending, businessesPending, withdrawalsPending] = await Promise.all([
        supabase.from("profiles")
          .select("id, full_name, email, kyc_status")
          .eq("kyc_status", "submitted")
          .is("deleted_at", null),
        supabase.from("business_profiles")
          .select("id, business_name, owner_user_id")
          .eq("status", "pending")
          .is("deleted_at", null),
        supabase.from("withdrawal_requests")
          .select("id, amount, user_id")
          .eq("status", "pending")
          .is("deleted_at", null)
      ]);

      return {
        pendingKyc: kycPending.data || [],
        pendingBusinesses: businessesPending.data || [],
        pendingWithdrawals: withdrawalsPending.data || [],
      };
    },
    enabled: !!user && isAdmin,
  });

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isLoading = statsLoading || activityLoading || pendingLoading;

  return (
    <DashboardLayout 
      title="Super Admin Overview" 
      subtitle="Complete platform visibility and control"
    >
      {/* Action Required Banner */}
      {pendingActions && (pendingActions.pendingKyc.length > 0 || pendingActions.pendingBusinesses.length > 0 || pendingActions.pendingWithdrawals.length > 0) && (
        <Card className="mb-6 border-warning bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="font-medium">Actions Required:</span>
              {pendingActions.pendingKyc.length > 0 && (
                <Badge variant="secondary">{pendingActions.pendingKyc.length} KYC Reviews</Badge>
              )}
              {pendingActions.pendingBusinesses.length > 0 && (
                <Badge variant="secondary">{pendingActions.pendingBusinesses.length} Business Approvals</Badge>
              )}
              {pendingActions.pendingWithdrawals.length > 0 && (
                <Badge variant="secondary">{pendingActions.pendingWithdrawals.length} Withdrawals</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <MetricCard icon={<Users />} label="Total Users" value={formatNumber(stats?.totalUsers || 0)} color="primary" />
            <MetricCard icon={<Building2 />} label="Businesses" value={formatNumber(stats?.totalBusinesses || 0)} color="accent" />
            <MetricCard icon={<TrendingUp />} label="Investments" value={formatNumber(stats?.totalInvestments || 0)} color="success" />
            <MetricCard icon={<DollarSign />} label="Total Invested" value={formatCurrency(stats?.totalInvestedAmount || 0)} color="primary" />
            <MetricCard icon={<Wallet />} label="Deposits" value={formatCurrency(stats?.totalDeposits || 0)} color="success" />
            <MetricCard icon={<Activity />} label="Units Sold" value={formatNumber(stats?.totalUnitsSold || 0)} color="accent" />
          </>
        )}
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* User Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admins</span>
              <Badge variant="outline">{stats?.adminCount || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Investors</span>
              <span className="font-medium">{stats?.investorCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Owners</span>
              <span className="font-medium">{stats?.businessOwnerCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KYC Verified</span>
              <span className="text-success">{stats?.kycVerified || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KYC Pending Review</span>
              <span className="text-warning">{stats?.kycSubmitted || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Business Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Business Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Approval</span>
              <Badge variant="secondary">{stats?.pendingBusinesses || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active</span>
              <span className="text-success">{stats?.activeBusinesses || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fully Funded</span>
              <span className="text-primary">{stats?.fundedBusinesses || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Deposits</span>
              <span className="text-success">{formatCurrency(stats?.totalDeposits || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Invested</span>
              <span className="text-primary">{formatCurrency(stats?.totalInvestedAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profits Distributed</span>
              <span className="text-success">{formatCurrency(stats?.totalProfitDistributed || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Withdrawn</span>
              <span>{formatCurrency(stats?.totalWithdrawn || 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">KYC Reviews</span>
              <Badge variant={pendingActions?.pendingKyc.length ? "destructive" : "outline"}>
                {pendingActions?.pendingKyc.length || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Approvals</span>
              <Badge variant={pendingActions?.pendingBusinesses.length ? "destructive" : "outline"}>
                {pendingActions?.pendingBusinesses.length || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Withdrawals</span>
              <Badge variant={pendingActions?.pendingWithdrawals.length ? "destructive" : "outline"}>
                {pendingActions?.pendingWithdrawals.length || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Amount</span>
              <span className="text-warning">{formatCurrency(stats?.pendingWithdrawalAmount || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Access */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recent Users</CardTitle>
            <Link to="/dashboard/admin/users">
              <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {activityLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity?.recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={user.kyc_status === "verified" ? "default" : "secondary"}>
                        {user.kyc_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Investments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recent Investments</CardTitle>
            <Link to="/dashboard/admin/funds">
              <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {activityLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity?.recentInvestments.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{inv.units} units</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-success">{formatCurrency(inv.total_amount)}</span>
                    </div>
                  ))}
                  {(!recentActivity?.recentInvestments || recentActivity.recentInvestments.length === 0) && (
                    <p className="text-muted-foreground text-sm text-center py-4">No investments yet</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Quick Access
          </CardTitle>
          <CardDescription>Manage all aspects of the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/dashboard/admin/users">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Users className="w-5 h-5" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link to="/dashboard/admin/businesses">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Building2 className="w-5 h-5" />
                <span>Manage Businesses</span>
              </Button>
            </Link>
            <Link to="/dashboard/admin/funds">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Wallet className="w-5 h-5" />
                <span>Fund Management</span>
              </Button>
            </Link>
            <Link to="/dashboard/admin/settings">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Eye className="w-5 h-5" />
                <span>Platform Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: "primary" | "accent" | "success" 
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent-foreground",
    success: "bg-success/10 text-success",
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]} w-fit mb-2`}>
          {icon}
        </div>
        <p className="text-lg font-bold truncate">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </CardContent>
    </Card>
  );
}
