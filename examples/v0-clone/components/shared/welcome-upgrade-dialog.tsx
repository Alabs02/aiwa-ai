"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Gem, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";

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
    // Track dismissal in localStorage to avoid showing again
    localStorage.setItem("welcome_dialog_dismissed", "true");
    onOpenChange(false);
  };

  useEffect(() => {
    return () => {
      localStorage.setItem("welcome_dialog_dismissed", "true");
    };
  }, []);

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border border-white/10 bg-black/95 p-0">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8">
          {/* <button
            onClick={handleContinueFree}
            className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button> */}

          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              {/* <Sparkles className="h-5 w-5 text-emerald-400" /> */}
              <DialogTitle className="text-3xl font-bold text-white">
                Welcome to AIWA!
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-neutral-300">
              You're on the <span className="font-semibold">Free Plan</span> (3
              projects, 15 credits). Most users unlock more with a paid plan.
            </DialogDescription>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Badge
                variant="secondary"
                className="border-0 bg-emerald-500/10 text-emerald-400"
              >
                ✓ No credit card required to start
              </Badge>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-0"
              >
                ✓ Cancel anytime
              </Badge>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4 p-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isHovered = hoveredPlan === plan.key;

            return (
              <div
                key={plan.key}
                onMouseEnter={() => setHoveredPlan(plan.key)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  plan.popular
                    ? "border-emerald-500/30 bg-white/[0.05] shadow-lg shadow-emerald-500/10"
                    : "border-white/5 bg-white/[0.03]"
                } ${isHovered ? "scale-105 border-white/20" : ""}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="border-0 bg-emerald-500/20 text-emerald-400 backdrop-blur-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="flex h-full flex-col p-5">
                  {/* Plan Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${plan.popular ? "bg-emerald-500/10" : "bg-white/5"}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${plan.popular ? "text-emerald-400" : "text-white"}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <p className="text-xs text-neutral-400">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-sm text-neutral-400">/month</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {plan.credits} credits per month
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="mb-5 flex-1 space-y-2">
                    {plan.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${plan.popular ? "text-emerald-400" : "text-neutral-400"}`}
                        />
                        <span className="text-sm text-neutral-300">
                          {highlight}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => handleUpgrade(plan.key)}
                    className={`w-full transition-all ${
                      plan.popular
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    Start with {plan.name}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-white/[0.02] p-4 text-center">
          <button
            onClick={handleContinueFree}
            className="text-sm text-neutral-400 transition-colors hover:text-neutral-300"
          >
            Continue with Free Plan →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
