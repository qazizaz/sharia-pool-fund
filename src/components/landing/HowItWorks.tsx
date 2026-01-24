import { UserPlus, Search, Coins, TrendingUp } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up and complete your KYC verification to start investing.",
  },
  {
    step: 2,
    icon: Search,
    title: "Browse Businesses",
    description: "Explore Shariah-compliant businesses seeking investment funding.",
  },
  {
    step: 3,
    icon: Coins,
    title: "Buy Units",
    description: "Purchase investment units at ₨25,000 each to fund your chosen business.",
  },
  {
    step: 4,
    icon: TrendingUp,
    title: "Earn Profits",
    description: "Receive proportional profit distributions when businesses report earnings.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-secondary/30 relative">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started with ethical investing in just four simple steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.step} {...step} isLast={index === steps.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ 
  step, 
  icon: Icon, 
  title, 
  description, 
  isLast 
}: { 
  step: number; 
  icon: React.ElementType; 
  title: string; 
  description: string;
  isLast: boolean;
}) {
  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
      )}
      
      <div className="text-center">
        {/* Step number with icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg glow-primary">
            <Icon className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-md">
            {step}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
