import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/constants";

type LedgerEntryType = "investment" | "profit_distribution" | "withdrawal" | "admin_adjustment" | "deposit";

const entryTypeConfig: Record<LedgerEntryType, { label: string; icon: typeof ArrowUpRight; colorClass: string }> = {
  investment: { label: "Investment", icon: ArrowUpRight, colorClass: "text-destructive" },
  profit_distribution: { label: "Profit", icon: ArrowDownLeft, colorClass: "text-success" },
  withdrawal: { label: "Withdrawal", icon: ArrowUpRight, colorClass: "text-destructive" },
  admin_adjustment: { label: "Adjustment", icon: FileText, colorClass: "text-warning" },
  deposit: { label: "Deposit", icon: ArrowDownLeft, colorClass: "text-success" },
};

export default function Transactions() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // First get wallet, then get ledger entries
  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", wallet?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_entries")
        .select("*")
        .eq("wallet_id", wallet!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!wallet,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const balance = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  return (
    <DashboardLayout title="Transactions" subtitle="View your wallet activity and transaction history">
      {/* Balance Card */}
      <Card className="mb-8 border-primary/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(balance)}</p>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="divide-y">
              {transactions.map((transaction) => {
                const config = entryTypeConfig[transaction.entry_type as LedgerEntryType];
                const Icon = config?.icon || FileText;
                const isPositive = Number(transaction.amount) > 0;
                const transactionType = isPositive ? "Credit" : "Debit";

                return (
                  <div 
                    key={transaction.id} 
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className={`p-2 rounded-full ${isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
                      <Icon className={`w-5 h-5 ${isPositive ? "text-success" : "text-destructive"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{config?.label || transaction.entry_type}</p>
                        <Badge 
                          variant={isPositive ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {transactionType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(transaction.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
                        {isPositive ? "+" : ""}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{transactionType}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground">Your transaction history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
