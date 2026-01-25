import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Building2, Calendar } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/constants";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MyInvestments() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const { data: investments, isLoading } = useQuery({
    queryKey: ["my-investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select(`
          *,
          business_profiles (
            id,
            business_name,
            sector,
            status
          )
        `)
        .eq("investor_user_id", user!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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

  const totalInvested = investments?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
  const totalUnits = investments?.reduce((sum, inv) => sum + inv.units, 0) || 0;
  const activeInvestments = investments?.filter(inv => inv.status === "active").length || 0;

  return (
    <DashboardLayout title="My Investments" subtitle="Track your investment portfolio">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Total Invested</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Total Units</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(totalUnits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Active Investments</span>
            </div>
            <p className="text-2xl font-bold">{activeInvestments}</p>
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <Card>
        <CardHeader>
          <CardTitle>Investment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : investments && investments.length > 0 ? (
            <div className="space-y-4">
              {investments.map((investment) => (
                <div 
                  key={investment.id} 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/businesses/${investment.business_profile_id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {investment.business_profiles?.business_name || "Unknown Business"}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {investment.units} units @ {formatCurrency(investment.unit_price)} each
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(investment.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(investment.total_amount)}</p>
                      <Badge variant={investment.status === "active" ? "default" : "secondary"} className="capitalize">
                        {investment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No investments yet</h3>
              <p className="text-muted-foreground mb-4">Start investing in Shariah-compliant businesses</p>
              <Link to="/businesses">
                <Button variant="gradient">Browse Businesses</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
