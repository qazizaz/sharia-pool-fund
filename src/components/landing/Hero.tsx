import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Users } from "lucide-react";
import { CURRENCY_SYMBOL, formatNumber, UNIT_PRICE } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 bg-hero-pattern"
        style={{ background: "var(--gradient-hero)" }}
      />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      
      <div className="container relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm text-primary-foreground/90">100% Shariah-Compliant</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 animate-slide-up">
            Invest in{" "}
            <span className="text-gradient-gold inline-block">Halal</span>{" "}
            Businesses
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Join Pakistan's premier Shariah-compliant investment platform. 
            Pool your capital with other investors to fund ethical businesses 
            and share in their profits.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth?mode=register">
              <Button variant="gold" size="xl" className="w-full sm:w-auto">
                Start Investing
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <StatCard 
              icon={<TrendingUp className="w-5 h-5" />}
              label="Unit Price"
              value={`${CURRENCY_SYMBOL} ${formatNumber(UNIT_PRICE)}`}
            />
            <StatCard 
              icon={<Users className="w-5 h-5" />}
              label="No Riba"
              value="0% Interest"
            />
            <StatCard 
              icon={<Shield className="w-5 h-5" />}
              label="Profit Sharing"
              value="Proportional"
            />
          </div>
        </div>
      </div>
      
      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
      <div className="p-2 rounded-lg bg-accent/20 text-accent">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-sm text-primary-foreground/70">{label}</p>
        <p className="text-lg font-semibold text-primary-foreground">{value}</p>
      </div>
    </div>
  );
}
