import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown,
  Building2,
  Users,
  Play,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Business {
  id: string;
  business_name: string;
  units_sold: number;
  status: string;
}

interface ProfitDistribution {
  id: string;
  business_profile_id: string;
  cycle_name: string;
  total_profit_amount: number;
  distribution_date: string;
  status: string;
  processed_at: string | null;
  created_at: string;
  business_profiles?: {
    business_name: string;
    units_sold: number;
  };
}

export default function AdminProfitDistribution() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<ProfitDistribution | null>(null);
  
  // Form state
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [cycleName, setCycleName] = useState("");
  const [profitAmount, setProfitAmount] = useState("");
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  // Fetch businesses with active investments
  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["admin-businesses-for-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("id, business_name, units_sold, status")
        .in("status", ["active", "funded"])
        .is("deleted_at", null)
        .gt("units_sold", 0)
        .order("business_name");

      if (error) throw error;
      return data as Business[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch profit distributions
  const { data: distributions, isLoading: distributionsLoading } = useQuery({
    queryKey: ["admin-profit-distributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profit_distributions")
        .select(`
          id,
          business_profile_id,
          cycle_name,
          total_profit_amount,
          distribution_date,
          status,
          processed_at,
          created_at,
          business_profiles (
            business_name,
            units_sold
          )
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProfitDistribution[];
    },
    enabled: !!user && isAdmin,
  });

  // Create distribution mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profit_distributions")
        .insert({
          business_profile_id: selectedBusinessId,
          cycle_name: cycleName,
          total_profit_amount: parseFloat(profitAmount),
          distribution_date: distributionDate,
          status: "pending"
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profit distribution created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-profit-distributions"] });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error) => {
      toast.error(handleError(error, "Create Distribution"));
    },
  });

  // Process distribution mutation
  const processMutation = useMutation({
    mutationFn: async (distributionId: string) => {
      const { data, error } = await supabase.rpc("process_profit_distribution_atomic", {
        p_profit_distribution_id: distributionId,
        p_admin_user_id: user!.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const result = data as any;
      const message = result.is_loss 
        ? `Loss distributed to ${result.investors_credited} investors` 
        : `Profit distributed to ${result.investors_credited} investors`;
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["admin-profit-distributions"] });
      setProcessDialogOpen(false);
      setSelectedDistribution(null);
    },
    onError: (error) => {
      toast.error(handleError(error, "Process Distribution"));
    },
  });

  const resetCreateForm = () => {
    setSelectedBusinessId("");
    setCycleName("");
    setProfitAmount("");
    setDistributionDate(new Date().toISOString().split('T')[0]);
  };

  const handleCreateSubmit = () => {
    if (!selectedBusinessId || !cycleName || !profitAmount) {
      toast.error("Please fill all required fields");
      return;
    }

    const amount = parseFloat(profitAmount);
    if (isNaN(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    createMutation.mutate();
  };

  const handleProcessClick = (distribution: ProfitDistribution) => {
    setSelectedDistribution(distribution);
    setProcessDialogOpen(true);
  };

  const handleProcessConfirm = () => {
    if (selectedDistribution) {
      processMutation.mutate(selectedDistribution.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing</Badge>;
      case "completed":
        return <Badge className="gap-1 bg-success text-success-foreground"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const pendingDistributions = distributions?.filter(d => d.status === "pending") || [];
  const completedDistributions = distributions?.filter(d => d.status === "completed") || [];
  const totalDistributed = completedDistributions.reduce((sum, d) => sum + d.total_profit_amount, 0);

  const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);
  const perUnitAmount = selectedBusiness && profitAmount 
    ? parseFloat(profitAmount) / selectedBusiness.units_sold 
    : 0;

  return (
    <DashboardLayout 
      title="Profit Distribution" 
      subtitle="Shariah-compliant profit and loss sharing"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Active Businesses</span>
            </div>
            <p className="text-2xl font-bold">{businesses?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Pending Distributions</span>
            </div>
            <p className="text-2xl font-bold">{pendingDistributions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold">{completedDistributions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${totalDistributed >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {totalDistributed >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <span className="text-sm text-muted-foreground">Total Distributed</span>
            </div>
            <p className={`text-2xl font-bold ${totalDistributed >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(totalDistributed)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shariah Info */}
      <Alert className="mb-6 border-primary/50 bg-primary/5">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Shariah-Compliant Distribution</AlertTitle>
        <AlertDescription>
          This system supports variable profit and loss sharing based on actual business performance. 
          Positive amounts distribute profits; negative amounts share losses proportionally among investors based on their unit holdings.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Distribution
        </Button>
      </div>

      {/* Distributions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Distributions</CardTitle>
          <CardDescription>Manage and process profit/loss distributions for businesses</CardDescription>
        </CardHeader>
        <CardContent>
          {distributionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : distributions && distributions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Per Unit</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.map((dist) => {
                  const unitsSold = dist.business_profiles?.units_sold || 1;
                  const perUnit = dist.total_profit_amount / unitsSold;
                  const isLoss = dist.total_profit_amount < 0;
                  
                  return (
                    <TableRow key={dist.id}>
                      <TableCell className="font-medium">
                        {dist.business_profiles?.business_name || "Unknown"}
                      </TableCell>
                      <TableCell>{dist.cycle_name}</TableCell>
                      <TableCell>
                        <span className={isLoss ? "text-destructive" : "text-success"}>
                          {isLoss ? "-" : "+"}{formatCurrency(Math.abs(dist.total_profit_amount))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={isLoss ? "text-destructive" : "text-success"}>
                          {formatCurrency(perUnit)}/unit
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(dist.distribution_date)}</TableCell>
                      <TableCell>{getStatusBadge(dist.status)}</TableCell>
                      <TableCell className="text-right">
                        {dist.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleProcessClick(dist)}
                            className="gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Process
                          </Button>
                        )}
                        {dist.status === "completed" && dist.processed_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(dist.processed_at)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No profit distributions yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create First Distribution
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Distribution Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Profit Distribution
            </DialogTitle>
            <DialogDescription>
              Enter the business performance data for this distribution cycle
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Business *</Label>
              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses?.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.business_name} ({business.units_sold} units)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cycle Name *</Label>
              <Input
                placeholder="e.g., Q1 2026, January 2026"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Total Profit/Loss Amount (PKR) *</Label>
              <Input
                type="number"
                placeholder="Positive for profit, negative for loss"
                value={profitAmount}
                onChange={(e) => setProfitAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter negative amount to distribute losses
              </p>
            </div>

            <div className="space-y-2">
              <Label>Distribution Date</Label>
              <Input
                type="date"
                value={distributionDate}
                onChange={(e) => setDistributionDate(e.target.value)}
              />
            </div>

            {selectedBusiness && profitAmount && !isNaN(parseFloat(profitAmount)) && (
              <div className={`p-4 rounded-lg ${parseFloat(profitAmount) >= 0 ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {parseFloat(profitAmount) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span className="font-medium">
                    {parseFloat(profitAmount) >= 0 ? "Profit Distribution" : "Loss Distribution"}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Total Units: <span className="font-semibold">{selectedBusiness.units_sold}</span></p>
                  <p>
                    Per Unit: <span className={`font-semibold ${parseFloat(profitAmount) >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(perUnitAmount)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Distribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Confirmation Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Process Distribution
            </DialogTitle>
            <DialogDescription>
              This action will distribute funds to all investors
            </DialogDescription>
          </DialogHeader>

          {selectedDistribution && (
            <div className="py-4">
              <Alert className={selectedDistribution.total_profit_amount >= 0 ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {selectedDistribution.total_profit_amount >= 0 ? "Profit Distribution" : "Loss Distribution"}
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p><strong>Business:</strong> {selectedDistribution.business_profiles?.business_name}</p>
                  <p><strong>Cycle:</strong> {selectedDistribution.cycle_name}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedDistribution.total_profit_amount)}</p>
                  <p><strong>Units:</strong> {selectedDistribution.business_profiles?.units_sold}</p>
                  <p><strong>Per Unit:</strong> {formatCurrency(selectedDistribution.total_profit_amount / (selectedDistribution.business_profiles?.units_sold || 1))}</p>
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground mt-4">
                {selectedDistribution.total_profit_amount >= 0 
                  ? "Investor wallets will be credited with their share of the profit."
                  : "Investor wallets will be debited with their share of the loss."}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessConfirm}
              disabled={processMutation.isPending}
              variant={selectedDistribution?.total_profit_amount && selectedDistribution.total_profit_amount < 0 ? "destructive" : "default"}
            >
              {processMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm & Process"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
