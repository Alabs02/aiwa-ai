"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Code2, Layers, Zap } from "lucide-react";

// Particle system for background effect
function ParticleField({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="animate-float absolute h-1 w-1 rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient background
function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="animate-gradient absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)"
        }}
      />
    </div>
  );
}

// Building blocks animation
function BuildingBlocks() {
  const blocks = [
    { icon: Code2, label: "Components", delay: "0s" },
    { icon: Layers, label: "Styling", delay: "0.3s" },
    { icon: Zap, label: "Logic", delay: "0.6s" }
  ];

  return (
    <div className="relative z-10 flex gap-4">
      {blocks.map((block, i) => (
        <div
          key={i}
          className="animate-slide-up flex flex-col items-center gap-2"
          style={{
            animationDelay: block.delay,
            opacity: 0,
            animationFillMode: "forwards"
          }}
        >
          <div className="relative">
            {/* Glassmorphic card using existing utility */}
            <div className="glass animate-glow relative rounded-lg p-4">
              <block.icon className="h-6 w-6 text-white/70" />
            </div>
          </div>
          <span className="font-body text-xs text-white/50">{block.label}</span>
        </div>
      ))}
    </div>
  );
}

// Status messages that rotate
function StatusMessage() {
  const messages = [
    "Analyzing your vision...",
    "Crafting components...",
    "Weaving the interface...",
    "Polishing interactions...",
    "Almost there..."
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-6 overflow-hidden">
      {messages.map((message, i) => (
        <p
          key={i}
          className={cn(
            "font-body absolute inset-x-0 text-center text-sm text-white/60 transition-all duration-500",
            i === currentMessage
              ? "translate-y-0 opacity-100"
              : i < currentMessage
                ? "-translate-y-6 opacity-0"
                : "translate-y-6 opacity-0"
          )}
        >
          {message}
        </p>
      ))}
    </div>
  );
}

// Wave progress indicator
function WaveProgress() {
  return (
    <div className="relative h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/5">
      <div className="shimmer absolute inset-0 h-full rounded-full bg-gradient-to-r from-violet-500/50 via-blue-500/50 to-violet-500/50" />
    </div>
  );
}

// Main Preview Loading Animation
export function PreviewLoadingAnimation() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
      {/* Background effects */}
      <AnimatedGradient />
      <ParticleField />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Icon with glow effect */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20 blur-xl" />
          <div className="glass relative rounded-full p-6">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
        </div>

        {/* Building blocks */}
        <BuildingBlocks />

        {/* Status message */}
        <StatusMessage />

        {/* Wave progress */}
        <WaveProgress />

        {/* Vibe tagline */}
        <p className="font-button animate-pulse-slow text-xs font-medium tracking-wider text-white/40">
          VIBE. BUILD. DEPLOY. ✨
        </p>
      </div>
    </div>
  );
}

// Code Generation Animation (for code view)
export function CodeGenerationAnimation() {
  const codeLines = [
    { width: "w-3/4", delay: "0s" },
    { width: "w-1/2", delay: "0.1s" },
    { width: "w-5/6", delay: "0.2s" },
    { width: "w-2/3", delay: "0.3s" },
    { width: "w-4/5", delay: "0.4s" },
    { width: "w-1/2", delay: "0.5s" },
    { width: "w-full", delay: "0.6s" },
    { width: "w-3/5", delay: "0.7s" }
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black p-8">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/10 via-transparent to-blue-950/10" />

      {/* Code editor mockup */}
      <div className="relative w-full max-w-2xl">
        {/* Editor header */}
        <div className="glass-subtle mb-4 flex items-center gap-2 rounded-t-lg px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
            <div className="h-3 w-3 rounded-full bg-green-500/50" />
          </div>
          <span className="ml-4 font-mono text-xs text-white/50">
            app/layout.tsx
          </span>
        </div>

        {/* Editor content with animated lines */}
        <div className="glass-subtle space-y-3 rounded-b-lg border-t-0 p-6">
          {codeLines.map((line, i) => (
            <div
              key={i}
              className="animate-fade-in-line relative h-4 overflow-hidden rounded"
              style={{
                animationDelay: line.delay,
                opacity: 0
              }}
            >
              <div
                className={cn(
                  "shimmer h-full rounded bg-gradient-to-r from-violet-500/30 to-blue-500/30",
                  line.width
                )}
              />
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse-slow h-2 w-2 rounded-full bg-violet-500/50"
                style={{
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          <span className="font-body text-xs text-white/50">
            Generating code...
          </span>
        </div>
      </div>
    </div>
  );
}
