"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  FolderTree,
  FileCode,
  Settings,
  Palette,
  CheckCircle
} from "lucide-react";

const generationStages = [
  { text: "Analyzing your request", icon: Sparkles },
  { text: "Setting up project structure", icon: FolderTree },
  { text: "Generating components", icon: FileCode },
  { text: "Writing application logic", icon: Settings },
  { text: "Applying styles", icon: Palette },
  { text: "Finalizing build", icon: CheckCircle }
];

// Different UI preview layouts that cycle
const uiLayouts = [
  // Layout 1: Landing page with hero
  {
    header: { hasLogo: true, hasNav: true },
    content: "hero",
    elements: [
      { type: "text", width: "60%", height: 8 },
      { type: "text", width: "80%", height: 6 },
      { type: "button", width: "30%", height: 12 }
    ]
  },
  // Layout 2: Dashboard
  {
    header: { hasLogo: true, hasNav: true },
    content: "dashboard",
    elements: [
      { type: "card", width: "100%", height: 20 },
      { type: "grid", items: 3 }
    ]
  },
  // Layout 3: Form layout
  {
    header: { hasLogo: true, hasNav: false },
    content: "form",
    elements: [
      { type: "input", width: "100%", height: 10 },
      { type: "input", width: "100%", height: 10 },
      { type: "button", width: "40%", height: 12 }
    ]
  }
];

interface PreviewLoadingAnimationProps {
  className?: string;
}

export function PreviewLoadingAnimation({
  className
}: PreviewLoadingAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [currentLayout, setCurrentLayout] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % generationStages.length);
    }, 2500);

    return () => clearInterval(stageInterval);
  }, []);

  useEffect(() => {
    const layoutInterval = setInterval(() => {
      setCurrentLayout((prev) => (prev + 1) % uiLayouts.length);
    }, 3000);

    return () => clearInterval(layoutInterval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  const layout = uiLayouts[currentLayout];
  const stage = generationStages[currentStage];
  const StageIcon = stage.icon;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-black",
        className
      )}
    >
      {/* Enhanced ambient glow with better visibility */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.12]">
        <div className="animate-pulse-slow absolute top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-orange-500/60 via-purple-500/40 to-blue-500/30 blur-[140px]" />
      </div>

      {/* Main content with refined spacing */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-8">
        {/* Enhanced status badge with stronger shimmer and better positioning */}
        <div className="relative">
          {/* More visible animated gradient border with double layer */}
          <div className="animate-spin-border absolute -inset-[2px] rounded-full bg-gradient-to-r from-orange-500/80 via-orange-500/80 via-purple-500/60 to-purple-500/60 opacity-75 blur-sm">
            <div className="h-full w-full rounded-full bg-black" />
          </div>
          <div className="animate-spin-border-reverse absolute -inset-[1px] rounded-full bg-gradient-to-r from-purple-500/60 via-orange-500/80 to-purple-500/60 opacity-60">
            <div className="h-full w-full rounded-full bg-black" />
          </div>

          {/* Enhanced badge content with better contrast */}
          <div className="relative flex items-center gap-3 rounded-full border border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-6 py-3.5 shadow-xl backdrop-blur-2xl">
            {/* Icon with enhanced glow */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/10 shadow-lg shadow-orange-500/20">
              <StageIcon className="h-4.5 w-4.5 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-white">
                {stage.text}
                <span className="inline-block w-6 text-left font-bold text-orange-400">
                  {dots}
                </span>
              </p>
              <p className="text-xs text-white/40">Your app is being crafted</p>
            </div>
          </div>
        </div>

        {/* Enhanced central preview mockup with stronger depth */}
        <div className="relative">
          {/* Third layer with enhanced shadow */}
          <div className="absolute inset-0 translate-y-6 scale-[0.90] rounded-3xl border border-white/[0.04] bg-white/[0.02] shadow-2xl backdrop-blur-sm" />

          {/* Second layer with better separation */}
          <div className="absolute inset-0 translate-y-3 scale-[0.95] rounded-3xl border border-white/[0.07] bg-white/[0.03] shadow-xl backdrop-blur-md" />

          {/* Main preview card with enhanced effects */}
          <div className="relative w-[440px] overflow-hidden rounded-3xl border border-white/[0.15] bg-gradient-to-b from-white/[0.08] to-white/[0.04] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            {/* Enhanced gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-black/[0.02]" />

            {/* Outer glow effect */}
            <div className="pointer-events-none absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-orange-500/10 via-transparent to-purple-500/10 opacity-50" />

            {/* Preview content with better padding */}
            <div className="relative p-7">
              {/* Browser header bar with enhanced styling */}
              <div className="mb-5 flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-red-400/80 shadow-[0_0_6px_rgba(248,113,113,0.4)]" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80 shadow-[0_0_6px_rgba(250,204,21,0.4)]" />
                <div className="h-3 w-3 rounded-full bg-green-400/80 shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
              </div>

              {/* App preview skeleton with refined animations */}
              <div className="space-y-5 transition-all duration-700">
                {/* Header with better styling */}
                <div className="flex items-center justify-between">
                  <div className="animate-pulse-refined h-7 w-24 rounded-md bg-gradient-to-r from-white/[0.15] to-white/[0.10] shadow-sm" />
                  {layout.header.hasNav && (
                    <div className="flex gap-3">
                      <div
                        className="animate-pulse-refined h-7 w-14 rounded-md bg-white/[0.12] shadow-sm"
                        style={{ animationDelay: "100ms" }}
                      />
                      <div
                        className="animate-pulse-refined h-7 w-14 rounded-md bg-white/[0.12] shadow-sm"
                        style={{ animationDelay: "200ms" }}
                      />
                      <div
                        className="animate-pulse-refined h-7 w-14 rounded-md bg-white/[0.12] shadow-sm"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  )}
                </div>

                {/* Main content area with enhanced layouts */}
                <div className="space-y-4 pt-3">
                  {layout.content === "hero" && (
                    <div className="space-y-4">
                      <div className="animate-pulse-refined h-9 w-[85%] rounded-lg bg-gradient-to-r from-white/[0.18] via-white/[0.12] to-white/[0.08] shadow-sm" />
                      <div
                        className="animate-pulse-refined h-6 w-full rounded-md bg-white/[0.12]"
                        style={{ animationDelay: "100ms" }}
                      />
                      <div
                        className="animate-pulse-refined h-6 w-[78%] rounded-md bg-white/[0.12]"
                        style={{ animationDelay: "200ms" }}
                      />
                      <div
                        className="animate-pulse-refined mt-5 h-12 w-40 rounded-xl bg-gradient-to-r from-orange-500/35 to-orange-500/25 shadow-lg shadow-orange-500/20"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  )}

                  {layout.content === "dashboard" && (
                    <div className="space-y-4">
                      <div className="animate-pulse-refined h-24 w-full rounded-xl border border-white/[0.10] bg-white/[0.10] shadow-sm" />
                      <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="animate-pulse-refined h-28 rounded-xl border border-white/[0.10] bg-white/[0.10] shadow-sm"
                            style={{ animationDelay: `${i * 100}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {layout.content === "form" && (
                    <div className="space-y-4">
                      <div className="animate-pulse-refined h-12 w-full rounded-lg border border-white/[0.10] bg-white/[0.10] shadow-sm" />
                      <div
                        className="animate-pulse-refined h-12 w-full rounded-lg border border-white/[0.10] bg-white/[0.10] shadow-sm"
                        style={{ animationDelay: "100ms" }}
                      />
                      <div
                        className="animate-pulse-refined h-32 w-full rounded-lg border border-white/[0.10] bg-white/[0.10] shadow-sm"
                        style={{ animationDelay: "200ms" }}
                      />
                      <div
                        className="animate-pulse-refined h-12 w-[45%] rounded-xl bg-gradient-to-r from-orange-500/35 to-orange-500/25 shadow-lg shadow-orange-500/20"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced shimmer effect */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced progress bar with no step counter */}
        <div className="w-full max-w-lg">
          <div className="relative h-1.5 overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.04] shadow-inner">
            {/* Background track glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent" />

            {/* Progress fill with enhanced effects */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 shadow-[0_0_16px_rgba(251,146,60,0.6),0_0_4px_rgba(251,146,60,0.8)] transition-all duration-500 ease-out"
              style={{
                width: `${((currentStage + 1) / generationStages.length) * 100}%`
              }}
            >
              {/* Enhanced shimmer on progress */}
              <div className="animate-shimmer-fast absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              {/* Glow pulse effect */}
              <div className="animate-pulse-glow absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/50 to-orange-500/50" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-refined {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.998);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes shimmer-fast {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes spin-border {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-border-reverse {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        .animate-pulse-refined {
          animation: pulse-refined 2.5s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .animate-shimmer-fast {
          animation: shimmer-fast 2s ease-in-out infinite;
        }

        .animate-spin-border {
          animation: spin-border 4s linear infinite;
        }

        .animate-spin-border-reverse {
          animation: spin-border-reverse 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

interface CodeGenerationAnimationProps {
  className?: string;
}

export function CodeGenerationAnimation({
  className
}: CodeGenerationAnimationProps) {
  const [lines, setLines] = useState<string[]>([]);

  const codeLines = [
    "import { useState } from 'react'",
    "",
    "export default function App() {",
    "  const [count, setCount] = useState(0)",
    "",
    "  return (",
    '    <div className="container">',
    "      <h1>Your App</h1>",
    "      <button onClick={() => setCount(count + 1)}>",
    "        Count: {count}",
    "      </button>",
    "    </div>",
    "  )",
    "}"
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < codeLines.length) {
        setLines((prev) => [...prev, codeLines[currentIndex]]);
        currentIndex++;
      } else {
        setLines([]);
        currentIndex = 0;
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn("flex h-full flex-col overflow-hidden bg-black", className)}
    >
      {/* Editor header */}
      <div className="glass-subtle flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="ml-2 font-mono text-sm text-white/40">
          app/page.tsx
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          <span className="text-xs text-white/30">Generating...</span>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto bg-black p-4 font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={index}
            className="animate-fade-in-line"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="mr-4 inline-block w-6 text-right text-white/20 select-none">
              {(index + 1).toString().padStart(2, " ")}
            </span>
            <span className="text-white/70">{line || " "}</span>
          </div>
        ))}
        <div className="animate-blink mt-1 inline-block h-4 w-2 bg-orange-500" />
      </div>

      <style jsx>{`
        @keyframes fade-in-line {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        .animate-fade-in-line {
          animation: fade-in-line 0.3s ease-out forwards;
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}
