import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Shield, 
  Wallet, 
  TrendingUp, 
  FileText, 
  LogOut, 
  Users, 
  Building2, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  roles?: ("investor" | "business_owner" | "admin")[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <Wallet className="w-5 h-5" /> },
  { href: "/dashboard/investments", label: "My Investments", icon: <TrendingUp className="w-5 h-5" />, roles: ["investor"] },
  { href: "/dashboard/transactions", label: "Transactions", icon: <FileText className="w-5 h-5" />, roles: ["investor"] },
  { href: "/dashboard/my-business", label: "My Business", icon: <Building2 className="w-5 h-5" />, roles: ["business_owner"] },
  { href: "/dashboard/admin/users", label: "Users", icon: <Users className="w-5 h-5" />, roles: ["admin"] },
  { href: "/dashboard/admin/businesses", label: "Businesses", icon: <Building2 className="w-5 h-5" />, roles: ["admin"] },
  { href: "/dashboard/admin/settings", label: "Settings", icon: <Settings className="w-5 h-5" />, roles: ["admin"] },
];

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { profile, userRole, signOut, isAdmin, isBusinessOwner, isInvestor } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const filterNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true;
      if (item.roles.includes("admin") && isAdmin) return true;
      if (item.roles.includes("business_owner") && isBusinessOwner) return true;
      if (item.roles.includes("investor") && isInvestor) return true;
      return false;
    });
  };

  const filteredNavItems = filterNavItems(navItems);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sidebar-primary">
            <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold text-sidebar-foreground">{APP_NAME}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sidebar-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-sidebar z-50 transform transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70" 
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground p-6 hidden lg:block">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="p-2 rounded-lg bg-sidebar-primary">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold">{APP_NAME}</span>
        </Link>
        
        <nav className="space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="mb-4 p-3 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {userRole?.role?.replace("_", " ") || "Investor"}
            </p>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70" 
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
}
