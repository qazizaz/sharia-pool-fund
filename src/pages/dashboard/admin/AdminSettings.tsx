import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Database, Bell } from "lucide-react";
import { APP_NAME, UNIT_PRICE, formatCurrency } from "@/lib/constants";

export default function AdminSettings() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Platform Settings" subtitle="Configure system-wide settings">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Platform Name</span>
              <span className="font-medium">{APP_NAME}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="font-medium">{formatCurrency(UNIT_PRICE)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-medium">PKR</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Core settings are defined in the application constants and require code changes to modify.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Security and compliance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Row Level Security</span>
              <span className="text-success font-medium">Enabled</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">KYC Required</span>
              <span className="text-success font-medium">Yes</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Shariah Compliance</span>
              <span className="text-success font-medium">Enforced</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
            <CardDescription>Database and export options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" disabled>
              Export Users (CSV)
            </Button>
            <Button variant="outline" className="w-full" disabled>
              Export Investments (CSV)
            </Button>
            <Button variant="outline" className="w-full" disabled>
              Export Ledger (CSV)
            </Button>
            <p className="text-xs text-muted-foreground">
              Export functionality coming soon.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Email and alert settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Email Notifications</span>
              <span className="text-muted-foreground">Not configured</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Admin Alerts</span>
              <span className="text-muted-foreground">Not configured</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Email notifications require additional setup.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
