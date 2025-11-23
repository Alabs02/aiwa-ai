"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Crown, Gem } from "lucide-react";
import { toast } from "sonner";
import { GL } from "../gl";
import { Leva } from "leva";

interface Subscription {
  plan: string;
  billing_cycle: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  rollover_credits: number;
  current_period_end: string;
  status: string;
}

const PLANS = {
  pro: {
    name: "Pro",
    monthly: 20,
    annual: 17,
    credits: 100,
    icon: Zap,
    features: [
      "100 AI credits monthly",
      "Prompt Enhancer & Library",
      "Export/Download code",
      "10 projects",
      "5 Integrations",
      "Credit rollovers",
      "Unlimited aiwa.codes subdomains"
    ]
  },
  advanced: {
    name: "Advanced",
    monthly: 50,
    annual: 41.5,
    credits: 350, // Updated from 250
    icon: Crown,
    features: [
      "350 AI credits monthly", // Updated
      "Everything in Pro",
      "Unlimited projects",
      "Auto-sync GitHub",
      "10 integrations",
      "Priority support"
    ]
  },
  ultimate: {
    name: "Ultimate",
    monthly: 100,
    annual: 88,
    credits: 800,
    icon: Gem,
    features: [
      "800 AI credits monthly",
      "Everything in Advanced",
      "In-app code edit",
      "Clone & Import any website",
      "20 Integrations",
      "VIP support"
    ]
  }
};

export function BillingClient() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/billing/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: "pro" | "advanced" | "ultimate") => {
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleBuyCredits = async (credits: number) => {
    try {
      const response = await fetch("/api/billing/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        toast.error("Failed to start purchase");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const creditsPercent = subscription
    ? (subscription.credits_remaining / subscription.credits_total) * 100
    : 0;

  // Check if user can buy credits (not on free plan)
  const canBuyCredits = subscription && subscription.plan !== "free";

  return (
    <div className="grid min-h-screen grid-cols-1 bg-black/95 p-6 md:p-8">
      <GL hovering={hovering} />

      <Leva hidden />

      <div className="bg-background/40 relative z-10 w-full">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Billing & Credits
            </h1>
            <p className="text-sm text-neutral-400">
              Manage your subscription and credits
            </p>
          </div>

          {/* Current Usage Card */}
          {subscription && (
            <div
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-400">Current plan</p>
                  <p className="text-2xl font-semibold text-white capitalize">
                    {subscription.plan}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Renews{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-neutral-400">Credits remaining</p>
                  <p className="text-3xl font-bold text-white">
                    {subscription.credits_remaining}
                  </p>
                  <p className="text-xs text-neutral-500">
                    of {subscription.credits_total} total
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Progress value={creditsPercent} className="h-1.5 bg-white/5" />
                {subscription.rollover_credits > 0 && (
                  <p className="text-xs text-neutral-500">
                    Includes {subscription.rollover_credits} rollover credits
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "annual" : "monthly"
                )
              }
              className="relative inline-flex h-6 w-11 items-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === "annual" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>

            <button
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                billingCycle === "annual"
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Annual
              <Badge
                variant="secondary"
                className="border-0 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              >
                Save 12-17%
              </Badge>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(PLANS).map(([key, plan]) => {
              const Icon = plan.icon;
              const isCurrentPlan = subscription?.plan === key;

              return (
                <div
                  key={key}
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isCurrentPlan
                      ? "border-white/15 bg-white/[0.05]"
                      : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex h-full flex-col rounded-2xl p-6 backdrop-blur-xl">
                    {/* Plan Header */}
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-white/5 p-2">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {plan.name}
                          </h3>
                          <Badge className="mt-1 rounded-full border-0 bg-white/5 text-xs text-neutral-300 hover:bg-white/10">
                            {plan.credits} credits
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">
                          $
                          {billingCycle === "monthly"
                            ? plan.monthly
                            : plan.annual}
                        </span>
                        <span className="text-sm text-neutral-400">/mo</span>
                      </div>
                      {billingCycle === "annual" && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Save ${((plan.monthly - plan.annual) * 12).toFixed(0)}{" "}
                          per year
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mb-6 flex-1 space-y-2.5">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          <span className="text-sm text-neutral-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={() =>
                        handleUpgrade(key as "pro" | "advanced" | "ultimate")
                      }
                      disabled={isCurrentPlan}
                      className={`mt-auto w-full transition-all duration-300 ${
                        isCurrentPlan
                          ? "cursor-default bg-white/5 text-neutral-400 hover:bg-white/5"
                          : "bg-white text-black hover:bg-white/90"
                      }`}
                    >
                      {isCurrentPlan ? "Current Plan" : "Upgrade"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buy Extra Credits - Only show for paid plans */}
          {canBuyCredits && (
            <div
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl"
            >
              <div className="mb-6 space-y-1">
                <h2 className="text-lg font-semibold text-white">
                  Buy Extra Credits
                </h2>
                <p className="text-sm text-neutral-400">
                  One-time credit purchases
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { credits: 50, price: 10 },
                  { credits: 100, price: 20 },
                  { credits: 200, price: 40 }
                ].map((pkg) => (
                  <div
                    key={pkg.credits}
                    className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05]"
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-xl font-semibold text-white">
                          {pkg.credits} Credits
                        </p>
                        <p className="text-sm text-neutral-400">
                          ${pkg.price} USD
                        </p>
                      </div>
                      <Button
                        onClick={() => handleBuyCredits(pkg.credits)}
                        className="w-full bg-white/5 text-white hover:bg-white/10"
                        variant="outline"
                      >
                        Purchase
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
