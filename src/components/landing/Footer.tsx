import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-sidebar-primary">
                <Shield className="w-6 h-6 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">{APP_NAME}</span>
            </div>
            <p className="text-sidebar-foreground/70 max-w-sm">
              Pakistan's premier Shariah-compliant investment platform. 
              Invest ethically, grow your wealth, and support halal businesses.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=register" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/businesses" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Browse Businesses
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/shariah-compliance" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Shariah Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-sidebar-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-sidebar-foreground/60">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
            <p className="text-sm text-sidebar-foreground/60">
              Built with ❤️ for ethical investing
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
