import { 
  Shield, 
  TrendingUp, 
  Users, 
  Wallet, 
  FileCheck, 
  BarChart3,
  Lock,
  RefreshCw
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Shariah-Compliant",
    description: "All investments are vetted for Islamic finance compliance. No interest (Riba), no guaranteed returns.",
  },
  {
    icon: TrendingUp,
    title: "Profit Sharing",
    description: "Profits are distributed proportionally based on your investment units when businesses report earnings.",
  },
  {
    icon: Users,
    title: "Crowd Investment",
    description: "Pool your capital with other investors to fund larger opportunities and share the risks.",
  },
  {
    icon: Wallet,
    title: "Digital Wallet",
    description: "Secure digital wallet to manage your funds, track investments, and withdraw profits.",
  },
  {
    icon: FileCheck,
    title: "Full Auditability",
    description: "Every transaction is recorded in an immutable ledger for complete transparency.",
  },
  {
    icon: BarChart3,
    title: "Real-time Dashboard",
    description: "Monitor your portfolio, track profit distributions, and analyze performance.",
  },
  {
    icon: Lock,
    title: "Secure Platform",
    description: "Bank-grade security with encrypted data, secure authentication, and role-based access.",
  },
  {
    icon: RefreshCw,
    title: "Easy Withdrawals",
    description: "Request withdrawals anytime. Funds are processed after admin verification.",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-dots opacity-50" />
      
      <div className="container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Why Choose <span className="text-primary">EasyInvest</span>?
          </h2>
          <p className="text-lg text-muted-foreground">
            A transparent, ethical, and profitable investment experience built on Islamic finance principles.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.title} 
              {...feature} 
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay: number;
}) {
  return (
    <div 
      className="group p-6 rounded-xl bg-card border border-border card-hover animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
        <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-card-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
