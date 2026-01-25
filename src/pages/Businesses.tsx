import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, TrendingUp, Users } from "lucide-react";
import { formatCurrency, formatNumber, UNIT_PRICE } from "@/lib/constants";

export default function Businesses() {
  const { data: businesses, isLoading, error } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .in("status", ["active", "funded"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Investment Opportunities</h1>
            <p className="text-muted-foreground">
              Browse Shariah-compliant businesses available for investment. Each unit costs {formatCurrency(UNIT_PRICE)}.
            </p>
          </div>

          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">Failed to load businesses</p>
              <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
            </div>
          )}

          {businesses && businesses.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active investment opportunities at the moment.</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for new businesses.</p>
            </div>
          )}

          {businesses && businesses.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => {
                const availableUnits = business.total_units_offered - business.units_sold;
                const fundingProgress = business.total_units_offered > 0 
                  ? (business.units_sold / business.total_units_offered) * 100 
                  : 0;

                return (
                  <Link key={business.id} to={`/businesses/${business.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{business.business_name}</CardTitle>
                          <Badge variant={business.status === "funded" ? "secondary" : "default"}>
                            {business.status === "funded" ? "Funded" : "Active"}
                          </Badge>
                        </div>
                        {business.sector && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{business.sector}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {business.description || "No description available."}
                        </p>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Funding Progress</span>
                            <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Unit Price</p>
                              <p className="text-sm font-medium">{formatCurrency(business.unit_price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Available</p>
                              <p className="text-sm font-medium">{formatNumber(availableUnits)} units</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
