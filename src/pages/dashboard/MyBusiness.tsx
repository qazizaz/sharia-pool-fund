import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, TrendingUp, Plus } from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/constants";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function MyBusiness() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    sector: "",
    total_units_offered: 100,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const { data: business, isLoading } = useQuery({
    queryKey: ["my-business", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("owner_user_id", user!.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: investors } = useQuery({
    queryKey: ["business-investors", business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, profiles:investor_user_id(full_name)")
        .eq("business_profile_id", business!.id)
        .is("deleted_at", null);

      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const createBusinessMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("business_profiles")
        .insert({
          owner_user_id: user!.id,
          business_name: formData.business_name,
          description: formData.description,
          sector: formData.sector,
          total_units_offered: formData.total_units_offered,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Business submitted for approval");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
    },
    onError: (error) => {
      toast.error("Failed to create business: " + error.message);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const fundingProgress = business && business.total_units_offered > 0 
    ? (business.units_sold / business.total_units_offered) * 100 
    : 0;

  return (
    <DashboardLayout title="My Business" subtitle="Manage your business profile and funding">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : business ? (
        <div className="space-y-6">
          {/* Business Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{business.business_name}</CardTitle>
                  <CardDescription className="capitalize">{business.sector || "No sector"}</CardDescription>
                </div>
                <Badge 
                  variant={
                    business.status === "active" ? "default" : 
                    business.status === "funded" ? "secondary" : 
                    business.status === "rejected" ? "destructive" : "outline"
                  }
                  className="capitalize"
                >
                  {business.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{business.description || "No description"}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Unit Price</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(business.unit_price)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Units Sold</span>
                  </div>
                  <p className="text-xl font-bold">{formatNumber(business.units_sold)} / {formatNumber(business.total_units_offered)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Units Available</span>
                  </div>
                  <p className="text-xl font-bold">{formatNumber(business.total_units_offered - business.units_sold)}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Raised (PKR)</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(business.units_sold * business.unit_price)}</p>
                </div>
              </div>

              {/* Funding Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Funding Progress</span>
                  <span className="font-semibold">{fundingProgress.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Investors ({investors?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investors && investors.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Total Investors</span>
                    <span className="font-bold">{investors.length}</span>
                  </div>
                  
                  {/* Investor List */}
                  <div className="divide-y rounded-lg border">
                    <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 text-sm font-medium text-muted-foreground">
                      <span>Investor Name</span>
                      <span className="text-center">Units Bought</span>
                      <span className="text-center">Investment Date</span>
                      <span className="text-right">Amount (PKR)</span>
                    </div>
                    {investors.map((inv: any) => (
                      <div key={inv.id} className="grid grid-cols-4 gap-4 p-3 items-center hover:bg-muted/20 transition-colors">
                        <div>
                          <p className="font-medium">{inv.profiles?.full_name || "Anonymous Investor"}</p>
                        </div>
                        <p className="text-center font-semibold text-primary">{formatNumber(inv.units)}</p>
                        <p className="text-center text-sm text-muted-foreground">{formatDate(inv.created_at)}</p>
                        <p className="text-right font-bold text-success">{formatCurrency(inv.total_amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No investors yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Business Profile</h3>
            <p className="text-muted-foreground mb-6">Create your business profile to start receiving investments</p>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Business Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Business Profile</DialogTitle>
                  <DialogDescription>
                    Submit your business for approval. Once approved, investors can purchase units.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name</Label>
                    <Input
                      id="name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Enter business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Sector</Label>
                    <Input
                      id="sector"
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      placeholder="e.g., Agriculture, Technology, Retail"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="units">Total Units to Offer</Label>
                    <Input
                      id="units"
                      type="number"
                      min={1}
                      value={formData.total_units_offered}
                      onChange={(e) => setFormData({ ...formData, total_units_offered: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your business and how it's Shariah-compliant..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button 
                    variant="gradient" 
                    onClick={() => createBusinessMutation.mutate()}
                    disabled={!formData.business_name || createBusinessMutation.isPending}
                  >
                    {createBusinessMutation.isPending ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
