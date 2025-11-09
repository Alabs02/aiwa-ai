"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FileCode, FileText, Folder, Sparkles } from "lucide-react";

const generationStages = [
  { icon: Sparkles, text: "Analyzing your request...", file: "" },
  {
    icon: Folder,
    text: "Setting up project structure...",
    file: "Creating workspace"
  },
  {
    icon: FileCode,
    text: "Generating components...",
    file: "app/components/ui"
  },
  {
    icon: FileCode,
    text: "Writing application logic...",
    file: "app/page.tsx"
  },
  { icon: FileText, text: "Applying styles...", file: "styles/globals.css" },
  { icon: FileCode, text: "Configuring dependencies...", file: "package.json" },
  { icon: Sparkles, text: "Building your app...", file: "" }
];

interface PreviewLoadingAnimationProps {
  className?: string;
}

export function PreviewLoadingAnimation({
  className
}: PreviewLoadingAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % generationStages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const stage = generationStages[currentStage];
  const Icon = stage.icon;

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center bg-gray-50 dark:bg-black",
        className
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="animate-gradient absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex max-w-md flex-col items-center gap-6 px-8">
        {/* Icon animation */}
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl dark:bg-blue-400/20" />
          <div className="relative rounded-full bg-white p-6 shadow-lg dark:bg-gray-900">
            <Icon className="h-12 w-12 animate-bounce text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-2 text-center">
          <p className="animate-fade-in text-lg font-semibold text-gray-900 dark:text-gray-100">
            {stage.text}
          </p>
          {stage.file && (
            <p className="animate-slide-up font-mono text-sm text-gray-600 dark:text-gray-400">
              {stage.file}
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {generationStages.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                index === currentStage
                  ? "scale-125 bg-blue-600 dark:bg-blue-400"
                  : "bg-gray-300 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        {/* Skeleton preview cards */}
        <div className="mt-8 w-full space-y-3">
          <div className="animate-pulse-slow h-20 rounded-lg bg-white shadow-sm dark:bg-gray-900" />
          <div className="animate-pulse-slow h-32 rounded-lg bg-white shadow-sm delay-100 dark:bg-gray-900" />
          <div className="animate-pulse-slow h-24 rounded-lg bg-white shadow-sm delay-200 dark:bg-gray-900" />
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            transform: translateX(-50%) translateY(-50%) rotate(0deg);
          }
          50% {
            transform: translateX(-30%) translateY(-30%) rotate(180deg);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-gradient {
          animation: gradient 8s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
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
        // Reset and start over
        setLines([]);
        currentIndex = 0;
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-gray-50 dark:bg-black",
        className
      )}
    >
      {/* Editor header */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="ml-2 font-mono text-sm text-gray-600 dark:text-gray-400">
          app/page.tsx
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Generating...
          </span>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto bg-white p-4 font-mono text-sm dark:bg-gray-900">
        {lines.map((line, index) => (
          <div
            key={index}
            className="animate-fade-in-line"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="mr-4 text-gray-400 select-none dark:text-gray-600">
              {(index + 1).toString().padStart(2, " ")}
            </span>
            <span className="text-gray-800 dark:text-gray-200">
              {line || " "}
            </span>
          </div>
        ))}
        <div className="animate-blink inline-block h-4 w-2 bg-blue-600 dark:bg-blue-400" />
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
