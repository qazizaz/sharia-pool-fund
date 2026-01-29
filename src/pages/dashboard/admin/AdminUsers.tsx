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
import { Users, Search, Shield, UserCheck, UserX } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminUsers() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      return profiles.map(profile => ({
        ...profile,
        role: roles.find(r => r.user_id === profile.user_id)?.role || "investor"
      }));
    },
    enabled: !!user && isAdmin,
  });

  const updateKycMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "pending" | "submitted" | "verified" | "rejected" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          kyc_status: status,
          kyc_verified_at: status === "verified" ? new Date().toISOString() : null
        })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("KYC status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(handleError(error, "KYC Update"));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "business_owner" | "investor" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(handleError(error, "Role Update"));
    },
  });

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const filteredUsers = users?.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout title="User Management" subtitle="Manage users, KYC status, and roles">
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="investor">Investors</SelectItem>
                <SelectItem value="business_owner">Business Owners</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({filteredUsers?.length || 0})
          </CardTitle>
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
              {filteredUsers.map((u) => (
                <div key={u.id} className="py-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{u.full_name}</p>
                      <Badge variant="outline" className="capitalize text-xs">
                        {u.role?.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">Joined: {formatDate(u.created_at)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* KYC Status with Full Control */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">KYC:</span>
                      <Select 
                        value={u.kyc_status} 
                        onValueChange={(status) => updateKycMutation.mutate({ 
                          userId: u.user_id, 
                          status: status as "pending" | "submitted" | "verified" | "rejected" 
                        })}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <Badge 
                            variant={
                              u.kyc_status === "verified" ? "default" : 
                              u.kyc_status === "rejected" ? "destructive" : 
                              u.kyc_status === "submitted" ? "secondary" : "outline"
                            }
                            className="capitalize"
                          >
                            {u.kyc_status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Quick Actions for Submitted Status */}
                      {u.kyc_status === "submitted" && (
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-success"
                            onClick={() => updateKycMutation.mutate({ userId: u.user_id, status: "verified" })}
                            title="Approve KYC"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-destructive"
                            onClick={() => updateKycMutation.mutate({ userId: u.user_id, status: "rejected" })}
                            title="Reject KYC"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {/* Quick Verify for Pending Status */}
                      {u.kyc_status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs"
                          onClick={() => updateKycMutation.mutate({ userId: u.user_id, status: "verified" })}
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Verify
                        </Button>
                      )}
                    </div>

                    {/* Role Selector */}
                    <Select 
                      value={u.role} 
                      onValueChange={(role) => updateRoleMutation.mutate({ userId: u.user_id, role: role as "admin" | "business_owner" | "investor" })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="business_owner">Business Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
