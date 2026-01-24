import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Wallet, TrendingUp, FileText, LogOut, Users, Building2, Settings } from "lucide-react";
import { APP_NAME, formatCurrency } from "@/lib/constants";

export default function Dashboard() {
  const { user, profile, userRole, signOut, loading, isAdmin, isBusinessOwner, isInvestor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground p-6 hidden lg:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-2 rounded-lg bg-sidebar-primary">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold">{APP_NAME}</span>
        </div>
        
        <nav className="space-y-2">
          <a href="#" className="sidebar-item active">
            <Wallet className="w-5 h-5" />
            Dashboard
          </a>
          {isInvestor && (
            <>
              <a href="#" className="sidebar-item">
                <TrendingUp className="w-5 h-5" />
                My Investments
              </a>
              <a href="#" className="sidebar-item">
                <FileText className="w-5 h-5" />
                Transactions
              </a>
            </>
          )}
          {isBusinessOwner && (
            <a href="#" className="sidebar-item">
              <Building2 className="w-5 h-5" />
              My Business
            </a>
          )}
          {isAdmin && (
            <>
              <a href="#" className="sidebar-item">
                <Users className="w-5 h-5" />
                Users
              </a>
              <a href="#" className="sidebar-item">
                <Building2 className="w-5 h-5" />
                Businesses
              </a>
              <a href="#" className="sidebar-item">
                <Settings className="w-5 h-5" />
                Settings
              </a>
            </>
          )}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Welcome back, {profile?.full_name || "User"}!
            </h1>
            <p className="text-muted-foreground">
              Role: <span className="capitalize font-medium text-primary">{userRole?.role?.replace("_", " ") || "Investor"}</span>
              {" · "}
              KYC: <span className={`capitalize font-medium ${profile?.kyc_status === "verified" ? "text-success" : "text-warning"}`}>
                {profile?.kyc_status || "Pending"}
              </span>
            </p>
          </div>
          <Button variant="gradient" className="lg:hidden" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Wallet />} label="Wallet Balance" value={formatCurrency(0)} />
          <StatCard icon={<TrendingUp />} label="Total Invested" value={formatCurrency(0)} />
          <StatCard icon={<FileText />} label="Active Units" value="0" />
          <StatCard icon={<TrendingUp />} label="Total Profit" value={formatCurrency(0)} />
        </div>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="gradient">Browse Businesses</Button>
            <Button variant="outline">Deposit Funds</Button>
            <Button variant="outline">Request Withdrawal</Button>
            <Button variant="secondary">Complete KYC</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat-card border border-border">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
