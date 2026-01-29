import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Building2, Search, Check, X, Eye } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/constants";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminBusinesses() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ businessId, status }: { businessId: string; status: string }) => {
      const updateData: any = { 
        status,
      };
      
      if (status === "active") {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user!.id;
      }

      const { error } = await supabase
        .from("business_profiles")
        .update(updateData)
        .eq("id", businessId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Business status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
    onError: (error) => {
      toast.error(handleError(error, "Business Update"));
    },
  });

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const filteredBusinesses = businesses?.filter(b => {
    const matchesSearch = b.business_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = businesses?.filter(b => b.status === "pending").length || 0;

  return (
    <DashboardLayout title="Business Management" subtitle="Review and manage business profiles">
      {/* Stats */}
      {pendingCount > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-warning" />
              <span className="font-medium">{pendingCount} business(es) pending approval</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by business name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Businesses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Businesses ({filteredBusinesses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredBusinesses && filteredBusinesses.length > 0 ? (
            <div className="divide-y">
              {filteredBusinesses.map((b) => {
                const fundingProgress = b.total_units_offered > 0 
                  ? (b.units_sold / b.total_units_offered) * 100 
                  : 0;

                return (
                  <div key={b.id} className="py-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{b.business_name}</p>
                          <Badge 
                            variant={
                              b.status === "active" ? "default" : 
                              b.status === "funded" ? "secondary" : 
                              b.status === "rejected" ? "destructive" : "outline"
                            }
                            className="capitalize"
                          >
                            {b.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{b.sector || "No sector"}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{b.description || "No description"}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <span>
                            <span className="text-muted-foreground">Units: </span>
                            <span className="font-medium">{formatNumber(b.units_sold)}/{formatNumber(b.total_units_offered)}</span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">Raised: </span>
                            <span className="font-medium">{formatCurrency(b.units_sold * b.unit_price)}</span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">Created: </span>
                            <span>{formatDate(b.created_at)}</span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 max-w-md">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link to={`/businesses/${b.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {b.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateStatusMutation.mutate({ businessId: b.id, status: "active" })}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ businessId: b.id, status: "rejected" })}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No businesses found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
