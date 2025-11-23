"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Gem } from "lucide-react";
import Link from "next/link";

interface UpgradePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  requiredPlan?: "pro" | "advanced" | "ultimate";
}

export function UpgradePromptDialog({
  open,
  onOpenChange,
  feature,
  requiredPlan = "pro"
}: UpgradePromptDialogProps) {
  const planNames = {
    pro: "Pro",
    advanced: "Advanced",
    ultimate: "Ultimate"
  };

  const planIcons = {
    pro: Crown,
    advanced: Crown,
    ultimate: Gem
  };

  const Icon = planIcons[requiredPlan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="text-primary h-5 w-5" />
            Upgrade to {planNames[requiredPlan]}
          </DialogTitle>
          <DialogDescription>
            {feature} is available on {planNames[requiredPlan]} and higher
            plans.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Unlock {feature.toLowerCase()} and many more features by upgrading
              your plan.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button asChild className="flex-1">
              <Link href="/billing">
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade Now
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
