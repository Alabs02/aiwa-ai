import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  type: "user" | "assistant";
  initials?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm"
};

export function Avatar({
  type,
  initials = "U",
  className,
  size = "md"
}: AvatarProps) {
  if (type === "assistant") {
    return (
      <div
        className={cn(
          "relative grid transform-gpu cursor-pointer place-items-center rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 p-0.5 shadow-inner brightness-100 transition-all duration-300 will-change-auto hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 hover:brightness-110",
          sizeClasses[size],
          className
        )}
      >
        <div className="!font-button relative grid size-full skew-2 grid-cols-1 place-items-center-safe rounded-full bg-black shadow-md">
          AI
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative grid transform-gpu cursor-pointer place-items-center rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 p-0.5 shadow-inner brightness-100 transition-all duration-300 will-change-auto hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 hover:brightness-110",
        sizeClasses[size],
        className
      )}
    >
      <div className="!font-button relative grid size-full skew-2 grid-cols-1 place-items-center-safe rounded-full bg-black shadow-md">
        {initials}
      </div>
    </div>
  );
}
