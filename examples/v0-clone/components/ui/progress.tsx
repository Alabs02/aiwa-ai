"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Dynamic color based on percentage
  const getColor = (val: number = 0) => {
    if (val >= 50) return "from-emerald-500 to-emerald-400";
    if (val >= 20) return "from-orange-500 to-orange-400";
    return "from-red-500 to-red-400";
  };

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 bg-gradient-to-r transition-all duration-500 ease-out",
          getColor(value ?? 0)
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
