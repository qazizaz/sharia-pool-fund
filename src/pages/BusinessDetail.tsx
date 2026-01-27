import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Building2, 
  TrendingUp, 
  Users, 
  Shield, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate, UNIT_PRICE } from "@/lib/constants";
import { toast } from "sonner";

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [units, setUnits] = useState(1);
  const [isInvesting, setIsInvesting] = useState(false);

  // Fetch user wallet balance
  const { data: walletBalance = 0 } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .single();

      if (!wallet) return 0;

      const { data: balance } = await supabase.rpc("get_wallet_balance", {
        _wallet_id: wallet.id,
      });

      return Number(balance) || 0;
    },
    enabled: !!user,
  });

  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const availableUnits = business 
    ? business.total_units_offered - business.units_sold 
    : 0;

  const fundingProgress = business && business.total_units_offered > 0 
    ? (business.units_sold / business.total_units_offered) * 100 
    : 0;

  const totalCost = business ? units * business.unit_price : 0;
  const hasInsufficientBalance = totalCost > walletBalance;

  const handleInvest = async () => {
    if (!user || !business) return;

    if (!profile || profile.kyc_status !== "verified") {
      toast.error("Please complete KYC verification before investing");
      return;
    }

    if (units < 1 || units > availableUnits) {
      toast.error(`Please select between 1 and ${availableUnits} units`);
      return;
    }

    setIsInvesting(true);
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to invest");
        return;
      }

      // Call atomic investment edge function
      const response = await supabase.functions.invoke("process-investment", {
        body: {
          business_profile_id: business.id,
          units: units,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Investment failed");
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || "Investment failed");
      }

      toast.success(`Successfully invested ${units} units in ${business.business_name}!`);
      setInvestDialogOpen(false);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Investment error:", err);
      const errorMessage = err.message || "Failed to complete investment. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsInvesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Business Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The business you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/businesses")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Businesses
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate("/businesses")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Businesses
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold mb-2">{business.business_name}</h1>
                {business.sector && (
                  <p className="text-muted-foreground uppercase tracking-wide text-sm">{business.sector}</p>
                )}
              </div>
              <Badge variant={business.status === "funded" ? "secondary" : "default"} className="text-sm">
                {business.status === "funded" ? "Fully Funded" : "Accepting Investment"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    About This Business
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {business.description || "No detailed description available for this business."}
                  </p>
                </CardContent>
              </Card>

              {business.shariah_compliance_certificate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-success" />
                      Shariah Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This business has been verified for Shariah compliance. Certificate: {business.shariah_compliance_certificate}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Listed On</span>
                      <span>{formatDate(business.created_at)}</span>
                    </div>
                    {business.approved_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approved On</span>
                        <span>{formatDate(business.approved_at)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle>Investment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                    <div className="text-center">
                      <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{formatCurrency(business.unit_price)}</p>
                      <p className="text-xs text-muted-foreground">Per Unit</p>
                    </div>
                    <div className="text-center">
                      <Users className="w-5 h-5 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{formatNumber(availableUnits)}</p>
                      <p className="text-xs text-muted-foreground">Units Available</p>
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Units</span>
                      <span>{formatNumber(business.total_units_offered)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Units Sold</span>
                      <span>{formatNumber(business.units_sold)}</span>
                    </div>
                  </div>

                  {user ? (
                    business.status === "active" && availableUnits > 0 ? (
                      <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="gradient" className="w-full">
                            Invest Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invest in {business.business_name}</DialogTitle>
                            <DialogDescription>
                              Select the number of units you want to purchase. Each unit costs {formatCurrency(UNIT_PRICE)}.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="units">Number of Units</Label>
                              <Input
                                id="units"
                                type="number"
                                min={1}
                                max={availableUnits}
                                value={units}
                                onChange={(e) => setUnits(Math.max(1, Math.min(availableUnits, parseInt(e.target.value) || 1)))}
                              />
                              <p className="text-xs text-muted-foreground">
                                Maximum available: {formatNumber(availableUnits)} units
                              </p>
                            </div>

                            {/* Wallet Balance Display */}
                            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Your Wallet Balance</span>
                                <span className="font-bold text-primary">{formatCurrency(walletBalance)}</span>
                              </div>
                            </div>

                            <div className="bg-muted p-4 rounded-lg">
                              <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Units</span>
                                <span>{units}</span>
                              </div>
                              <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Price per Unit</span>
                                <span>{formatCurrency(business.unit_price)}</span>
                              </div>
                              <div className="flex justify-between font-bold border-t border-border pt-2">
                                <span>Total Amount</span>
                                <span className={totalCost > walletBalance ? "text-destructive" : "text-primary"}>
                                  {formatCurrency(totalCost)}
                                </span>
                              </div>
                            </div>

                            {/* Insufficient Balance Warning */}
                            {totalCost > walletBalance && (
                              <div className="flex items-start gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">
                                  Insufficient wallet balance. You need {formatCurrency(totalCost - walletBalance)} more to complete this investment.
                                  <Link to="/dashboard" className="underline ml-1">Add funds</Link>
                                </p>
                              </div>
                            )}

                            {profile?.kyc_status !== "verified" && (
                              <div className="flex items-start gap-2 text-warning bg-warning/10 p-3 rounded-lg">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">
                                  You need to complete KYC verification before investing. 
                                  <Link to="/dashboard" className="underline ml-1">Complete KYC</Link>
                                </p>
                              </div>
                            )}
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setInvestDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="gradient" 
                              onClick={handleInvest}
                              disabled={isInvesting || profile?.kyc_status !== "verified" || hasInsufficientBalance}
                            >
                              {isInvesting ? "Processing..." : "Confirm Investment"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button disabled className="w-full">
                        {business.status === "funded" ? "Fully Funded" : "No Units Available"}
                      </Button>
                    )
                  ) : (
                    <Button variant="gradient" className="w-full" onClick={() => navigate("/auth")}>
                      Sign In to Invest
                    </Button>
                  )}
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground text-center">
                Investment involves risk. Past profits do not guarantee future returns. 
                This is a Shariah-compliant investment with no guaranteed returns.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
