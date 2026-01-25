import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, TrendingUp, Users, Shield, Search } from "lucide-react";
import { formatCurrency, formatNumber, UNIT_PRICE, CURRENCY_SYMBOL } from "@/lib/constants";

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

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
        />
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        
        <div className="container relative z-10 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm mb-6 animate-fade-in">
              <Search className="w-4 h-4 text-accent" />
              <span className="text-sm text-primary-foreground/90">Browse Opportunities</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-4 animate-slide-up">
              Investment{" "}
              <span className="text-gradient-gold inline-block">Opportunities</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-6 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Explore Shariah-compliant businesses seeking investment. Each unit costs {CURRENCY_SYMBOL} {formatNumber(UNIT_PRICE)}.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-sm text-primary-foreground">Shariah-Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm text-primary-foreground">Profit Sharing</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-sm text-primary-foreground">Crowd Funded</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Businesses Grid */}
      <main className="flex-1 container py-12">
        <div className="max-w-6xl mx-auto">
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-destructive font-medium mb-2">Failed to load businesses</p>
              <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
            </div>
          )}

          {businesses && businesses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Opportunities Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There are no active investment opportunities at the moment. Check back soon for new Shariah-compliant businesses.
              </p>
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
                    <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-border hover:border-primary/50 group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {business.business_name}
                            </CardTitle>
                            {business.sector && (
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                                {business.sector}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant={business.status === "funded" ? "secondary" : "default"}
                            className="shrink-0"
                          >
                            {business.status === "funded" ? "Funded" : "Active"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                          {business.description || "No description available for this business."}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Funding Progress</span>
                            <span className="font-semibold text-primary">{fundingProgress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Unit Price</p>
                              <p className="text-sm font-semibold">{formatCurrency(business.unit_price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-accent/10">
                              <Users className="w-3.5 h-3.5 text-accent" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Available</p>
                              <p className="text-sm font-semibold">{formatNumber(availableUnits)} units</p>
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
