import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import NotFound from "./pages/NotFound";

// Dashboard pages
import Dashboard from "./pages/Dashboard";
import MyInvestments from "./pages/dashboard/MyInvestments";
import Transactions from "./pages/dashboard/Transactions";
import MyBusiness from "./pages/dashboard/MyBusiness";

// Admin pages
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import AdminBusinesses from "./pages/dashboard/admin/AdminBusinesses";
import AdminSettings from "./pages/dashboard/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/businesses/:id" element={<BusinessDetail />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/investments" element={<MyInvestments />} />
            <Route path="/dashboard/transactions" element={<Transactions />} />
            <Route path="/dashboard/my-business" element={<MyBusiness />} />

            {/* Admin Routes */}
            <Route path="/dashboard/admin/users" element={<AdminUsers />} />
            <Route path="/dashboard/admin/businesses" element={<AdminBusinesses />} />
            <Route path="/dashboard/admin/settings" element={<AdminSettings />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
