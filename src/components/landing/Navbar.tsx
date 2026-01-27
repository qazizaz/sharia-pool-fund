import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">{APP_NAME}</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/businesses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Businesses
            </Link>
            
            
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button variant="gradient" size="sm">Get Started</Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isOpen && <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-4">
              <Link to="/businesses" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
                Businesses
              </Link>
              
              
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link to="/auth?mode=register" onClick={() => setIsOpen(false)}>
                  <Button variant="gradient" className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>}
      </div>
    </nav>;
}