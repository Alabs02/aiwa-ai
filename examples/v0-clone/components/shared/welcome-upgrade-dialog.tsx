"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Gem, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface WelcomeUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLANS = [
  {
    key: "pro",
    name: "Pro",
    price: 20,
    credits: 100,
    icon: Zap,
    popular: false,
    description: "Perfect for getting started",
    highlights: [
      "100 AI credits monthly",
      "Prompt Enhancer & Library",
      "GitHub integration",
      "10 projects",
      "Credit rollovers"
    ]
  },
  {
    key: "advanced",
    name: "Advanced",
    price: 50,
    credits: 350,
    icon: Crown,
    popular: true,
    description: "Most chosen by new users",
    highlights: [
      "350 AI credits monthly",
      "Everything in Pro",
      "Unlimited projects",
      "Auto-sync GitHub",
      "Priority support"
    ]
  },
  {
    key: "ultimate",
    name: "Ultimate",
    price: 100,
    credits: 800,
    icon: Gem,
    popular: false,
    description: "For power users",
    highlights: [
      "800 AI credits monthly",
      "Everything in Advanced",
      "In-app code edit",
      "Clone any website",
      "VIP support"
    ]
  }
];

export function WelcomeUpgradeDialog({
  open,
  onOpenChange
}: WelcomeUpgradeDialogProps) {
  const router = useRouter();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const handleUpgrade = (plan: string) => {
    router.push(`/billing?plan=${plan}`);
    onOpenChange(false);
  };

  const handleContinueFree = () => {
    localStorage.setItem("welcome_dialog_dismissed", "true");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleContinueFree}
      />

      {/* Dialog */}
      <div
        className={cn(
          "glass relative z-10 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/[0.12]",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        )}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-4 sm:p-6 md:p-8">
          {/* Close button */}
          <button
            onClick={handleContinueFree}
            className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Welcome to AIWA!
            </h2>
            <p className="text-sm text-neutral-300 sm:text-base">
              You're on the <span className="font-semibold">Free Plan</span> (3
              projects, 15 credits). Most users unlock more with a paid plan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-1">
              <Badge
                variant="secondary"
                className="border-0 bg-emerald-500/10 text-xs text-emerald-400 sm:text-sm"
              >
                ✓ No credit card required to start
              </Badge>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-0 text-xs sm:text-sm"
              >
                ✓ Cancel anytime
              </Badge>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="overflow-y-auto">
          <div className="grid gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isHovered = hoveredPlan === plan.key;

              return (
                <div
                  key={plan.key}
                  onMouseEnter={() => setHoveredPlan(plan.key)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border transition-all duration-300",
                    plan.popular
                      ? "border-emerald-500/30 bg-white/[0.05] shadow-lg shadow-emerald-500/10"
                      : "border-white/[0.08] bg-white/[0.03]",
                    isHovered && "scale-[1.02] border-white/20 md:scale-105"
                  )}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="border-0 bg-emerald-500/20 text-xs text-emerald-400 backdrop-blur-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex h-full flex-col p-4 sm:p-5">
                    {/* Plan Header */}
                    <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                      <div
                        className={cn(
                          "rounded-lg p-2",
                          plan.popular ? "bg-emerald-500/10" : "bg-white/5"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 sm:h-5 sm:w-5",
                            plan.popular ? "text-emerald-400" : "text-white"
                          )}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white sm:text-base">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-neutral-400">
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white sm:text-3xl">
                          ${plan.price}
                        </span>
                        <span className="text-xs text-neutral-400 sm:text-sm">
                          /month
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {plan.credits} credits per month
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="mb-4 flex-1 space-y-1.5 sm:mb-5 sm:space-y-2">
                      {plan.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4",
                              plan.popular
                                ? "text-emerald-400"
                                : "text-neutral-400"
                            )}
                          />
                          <span className="text-xs text-neutral-300 sm:text-sm">
                            {highlight}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={() => handleUpgrade(plan.key)}
                      className={cn(
                        "w-full text-xs transition-all sm:text-sm",
                        plan.popular
                          ? "bg-emerald-500 text-black hover:bg-emerald-400"
                          : "bg-white text-black hover:bg-white/90"
                      )}
                    >
                      Start with {plan.name}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.08] bg-white/[0.02] p-3 text-center sm:p-4">
          <button
            onClick={handleContinueFree}
            className="text-xs text-neutral-400 transition-colors hover:text-neutral-300 sm:text-sm"
          >
            Continue with Free Plan →
          </button>
        </div>
      </div>
    </div>
  );
}
