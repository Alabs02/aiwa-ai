"use client";

import { GL } from "@/components/gl";
import { cn } from "@/lib/utils";
import { Leva } from "leva";
import Image from "next/image";
import React, { useState } from "react";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [hovering, setHovering] = useState(false);
  return (
    <>
      <GL hovering={hovering} />

      <main className="w--full flex min-h-screen flex-col items-center justify-center overflow-x-hidden border-none">
        {/* {children} */}

        <div
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className={cn(
            "bg-background/45 relative z-10 flex min-h-[50vh] w-5/6 flex-col items-center-safe gap-y-4 rounded-2xl border p-5 backdrop-blur-xs md:w-3/7 md:gap-y-8 md:p-10 lg:w-2/5 xl:w-2/6 2xl:w-1/4",
            // Border with subtle gradient
            "border border-white/[0.08] dark:border-white/[0.08]",
            // Shadows for depth
            "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
            // Hover state - enhance the glass effect
            "hover:border-white/[0.15] hover:bg-white/[0.08]",
            "hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.45)]",
            "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
            // Smooth transitions
            "transition-all duration-500 ease-out",
            // Inner glow with gradient overlay
            "relative overflow-hidden",
            // Shimmer effect on hover
            "before:absolute before:inset-0 before:rounded-2xl",
            "before:bg-gradient-to-br before:from-white/[0.12] before:via-white/[0.03] before:to-transparent",
            "before:opacity-0 hover:before:opacity-100",
            "before:transition-all before:duration-500",
            "before:pointer-events-none"
          )}
        >
          <div className="relative grid h-9 w-20 cursor-pointer grid-cols-1 overflow-hidden border-none">
            <Image
              src={"/aiwa.webp"}
              alt={"Aiwa Brand Logo"}
              fill
              priority
              draggable={false}
              className="size-full object-contain"
            />
          </div>

          {children}
        </div>
      </main>

      <Leva hidden />
    </>
  );
}
