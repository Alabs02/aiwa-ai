"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Zap, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";

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
    features: [
      "100 AI credits monthly",
      "Prompt Enhancer & Library",
      "Export/Download code",
      "GitHub integration",
      "10 projects max",
      "Credit rollovers",
      "Unlimited aiwa.codes subdomains"
    ]
  },
  advanced: {
    name: "Advanced",
    monthly: 50,
    annual: 41.5,
    credits: 250,
    features: [
      "250 AI credits monthly",
      "Everything in Pro",
      "Unlimited projects",
      "Auto-sync GitHub",
      "Priority support",
      "Advanced integrations"
    ]
  }
};

export function BillingClient() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

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

  const handleUpgrade = async (plan: "pro" | "advanced") => {
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

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Billing & Credits</h1>
          <p className="text-muted-foreground">
            Manage your subscription and credits
          </p>
        </div>

        {/* Current Plan */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle>Current Plan: {subscription.plan}</CardTitle>
              <CardDescription>
                Period ends{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {subscription.credits_remaining} /{" "}
                    {subscription.credits_total} credits
                  </span>
                  <Badge
                    variant={creditsPercent < 20 ? "destructive" : "default"}
                  >
                    {creditsPercent.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={creditsPercent} />
              </div>
              {subscription.rollover_credits > 0 && (
                <p className="text-muted-foreground text-sm">
                  Includes {subscription.rollover_credits} rollover credits
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Buy Extra Credits */}
        {subscription?.plan !== "free" && (
          <Card>
            <CardHeader>
              <CardTitle>Buy Extra Credits</CardTitle>
              <CardDescription>One-time credit purchases</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                { credits: 50, price: 10 },
                { credits: 100, price: 20 },
                { credits: 200, price: 40 }
              ].map((pkg) => (
                <Card key={pkg.credits} className="border-2">
                  <CardHeader>
                    <CardTitle>{pkg.credits} Credits</CardTitle>
                    <CardDescription>${pkg.price} USD</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => handleBuyCredits(pkg.credits)}
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div>
          <div className="mb-6 flex items-center justify-center gap-2">
            <span
              className={
                billingCycle === "monthly"
                  ? "font-semibold"
                  : "text-muted-foreground"
              }
            >
              Monthly
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "annual" : "monthly"
                )
              }
            >
              Toggle
            </Button>
            <span
              className={
                billingCycle === "annual"
                  ? "font-semibold"
                  : "text-muted-foreground"
              }
            >
              Annual <Badge variant="secondary">Save 15-17%</Badge>
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(PLANS).map(([key, plan]) => (
              <Card key={key} className="relative border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {key === "advanced" ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        <Zap className="h-5 w-5" />
                      )}
                      {plan.name}
                    </CardTitle>
                    <Badge>{plan.credits} credits</Badge>
                  </div>
                  <div className="text-3xl font-bold">
                    ${billingCycle === "monthly" ? plan.monthly : plan.annual}
                    <span className="text-muted-foreground text-base font-normal">
                      /mo
                    </span>
                  </div>
                  {billingCycle === "annual" && (
                    <p className="text-muted-foreground text-sm">
                      Save ${((plan.monthly - plan.annual) * 12).toFixed(0)}
                      /year
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="text-primary mt-0.5 h-4 w-4" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(key as "pro" | "advanced")}
                    disabled={subscription?.plan === key}
                  >
                    {subscription?.plan === key ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
