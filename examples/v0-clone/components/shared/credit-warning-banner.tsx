"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CreditWarningBannerProps {
  creditsRemaining: number;
  show: boolean;
}

export function CreditWarningBanner({
  creditsRemaining,
  show
}: CreditWarningBannerProps) {
  if (!show) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          Low credits: {creditsRemaining} remaining. Purchase more to continue
          generating.
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/billing">Add Credits</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
