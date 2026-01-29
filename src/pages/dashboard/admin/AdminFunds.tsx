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
import { Textarea } from "@/components/ui/textarea";
import { 
  Wallet, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Send,
  Plus
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

interface UserWithWallet {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  wallet_id: string;
  balance: number;
}

export default function AdminFunds() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithWallet | null>(null);
  const [actionType, setActionType] = useState<"deposit" | "admin_adjustment">("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  // Fetch all users with their wallets and balances
  const { data: usersWithWallets, isLoading } = useQuery({
    queryKey: ["admin-user-wallets"],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email")
        .is("deleted_at", null)
        .order("full_name", { ascending: true });

      if (profilesError) throw profilesError;

      // Get wallets
      const { data: wallets, error: walletsError } = await supabase
        .from("wallets")
        .select("id, user_id")
        .is("deleted_at", null);

      if (walletsError) throw walletsError;

      // Get balances for each wallet
      const usersWithBalances: UserWithWallet[] = [];

      for (const profile of profiles) {
        const wallet = wallets.find(w => w.user_id === profile.user_id);
        if (wallet) {
          // Get balance from ledger entries
          const { data: balanceData } = await supabase.rpc("get_wallet_balance", {
            _wallet_id: wallet.id
          });

          usersWithBalances.push({
            ...profile,
            wallet_id: wallet.id,
            balance: Number(balanceData) || 0
          });
        }
      }

      return usersWithBalances;
    },
    enabled: !!user && isAdmin,
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async ({ 
      walletId, 
      amount, 
      entryType, 
      description 
    }: { 
      walletId: string; 
      amount: number; 
      entryType: "deposit" | "admin_adjustment"; 
      description: string;
    }) => {
      const { error } = await supabase
        .from("ledger_entries")
        .insert({
          wallet_id: walletId,
          amount: amount,
          entry_type: entryType,
          description: description,
          created_by: user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Funds added successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-user-wallets"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(handleError(error, "Add Funds"));
    },
  });

  const resetForm = () => {
    setSelectedUser(null);
    setAmount("");
    setDescription("");
    setActionType("deposit");
  };

  const handleOpenDialog = (userWallet: UserWithWallet) => {
    setSelectedUser(userWallet);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedUser || !amount || !description) {
      toast.error("Please fill all fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    addFundsMutation.mutate({
      walletId: selectedUser.wallet_id,
      amount: numAmount,
      entryType: actionType,
      description: description
    });
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const filteredUsers = usersWithWallets?.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalFunds = usersWithWallets?.reduce((sum, u) => sum + u.balance, 0) || 0;

  return (
    <DashboardLayout title="Fund Management" subtitle="Add funds and manage investor wallets">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Total Platform Funds</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalFunds)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{usersWithWallets?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground">Active Wallets</span>
            </div>
            <p className="text-2xl font-bold">{usersWithWallets?.filter(u => u.balance > 0).length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            User Wallets ({filteredUsers?.length || 0})
          </CardTitle>
          <CardDescription>Click on a user to add or adjust funds</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="divide-y">
              {filteredUsers.map((userWallet) => (
                <div 
                  key={userWallet.id} 
                  className="py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{userWallet.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{userWallet.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={`font-semibold ${userWallet.balance >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(userWallet.balance)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenDialog(userWallet)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Funds
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Add Funds
            </DialogTitle>
            <DialogDescription>
              Add funds to {selectedUser?.full_name}'s wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select value={actionType} onValueChange={(v) => setActionType(v as "deposit" | "admin_adjustment")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="admin_adjustment">Admin Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <Input
                type="number"
                placeholder="Enter amount (positive to add, negative to deduct)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use positive numbers to add funds, negative to deduct
              </p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter reason for this transaction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {selectedUser && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  Current Balance: <span className="font-semibold">{formatCurrency(selectedUser.balance)}</span>
                </p>
                {amount && !isNaN(parseFloat(amount)) && (
                  <p className="text-sm">
                    New Balance: <span className="font-semibold">{formatCurrency(selectedUser.balance + parseFloat(amount))}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={addFundsMutation.isPending}
            >
              {addFundsMutation.isPending ? "Processing..." : "Add Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
