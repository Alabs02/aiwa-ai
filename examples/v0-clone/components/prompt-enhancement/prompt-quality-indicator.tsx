"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Loader
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card";

interface PromptAnalysis {
  qualityScore: "excellent" | "good" | "fair" | "weak";
  clarity: number;
  specificity: number;
  completeness: number;
  actionability: number;
  overallScore: number;
  feedback: string[];
  suggestions: string[];
}

interface PromptQualityIndicatorProps {
  prompt: string;
  onAnalysisChange?: (analysis: PromptAnalysis | null) => void;
  className?: string;
}

const QUALITY_CONFIG = {
  excellent: {
    icon: Sparkles,
    label: "Excellent",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  good: {
    icon: CheckCircle,
    label: "Good",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  fair: {
    icon: Lightbulb,
    label: "Fair",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20"
  },
  weak: {
    icon: AlertCircle,
    label: "Needs Work",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20"
  }
};

export function PromptQualityIndicator({
  prompt,
  onAnalysisChange,
  className
}: PromptQualityIndicatorProps) {
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!prompt || prompt.trim().length < 10) {
      setAnalysis(null);
      setIsAnalyzing(false);
      onAnalysisChange?.(null);
      return;
    }

    setIsAnalyzing(true);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/prompts/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
          onAnalysisChange?.(data);
        }
      } catch (error) {
        console.error("Failed to analyze prompt:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
      setIsAnalyzing(false);
    };
  }, [prompt, onAnalysisChange]);

  // Don't show anything if prompt is too short
  if (!prompt || prompt.trim().length < 10) {
    return null;
  }

  // Show analyzing state
  if (isAnalyzing && !analysis) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          "border-white/10 bg-white/5 text-white/40",
          "animate-pulse",
          className
        )}
      >
        <Loader className="h-3.5 w-3.5 animate-spin" />
        <span>Analyzing...</span>
      </div>
    );
  }

  // Show analysis result
  if (analysis) {
    const config = QUALITY_CONFIG[analysis.qualityScore];
    const Icon = config.icon;

    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-300",
              config.color,
              config.bgColor,
              config.borderColor,
              "hover:opacity-80",
              "animate-in fade-in slide-in-from-top-1 duration-300",
              className
            )}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          className="w-80 border-white/10 bg-black/90 backdrop-blur-xl"
          side="top"
          align="end"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Prompt Quality Analysis
              </h4>
              <span className={cn("text-xs font-medium", config.color)}>
                {Math.round(analysis.overallScore * 100)}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Clarity</span>
                  <span className="text-white/80">
                    {Math.round(analysis.clarity * 100)}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      config.bgColor
                    )}
                    style={{ width: `${analysis.clarity * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Specificity</span>
                  <span className="text-white/80">
                    {Math.round(analysis.specificity * 100)}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      config.bgColor
                    )}
                    style={{ width: `${analysis.specificity * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Completeness</span>
                  <span className="text-white/80">
                    {Math.round(analysis.completeness * 100)}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      config.bgColor
                    )}
                    style={{ width: `${analysis.completeness * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {analysis.feedback.length > 0 && (
              <div className="space-y-1.5 border-t border-white/10 pt-3">
                <p className="text-xs font-medium text-white/80">Feedback:</p>
                <ul className="space-y-1 text-xs text-white/60">
                  {analysis.feedback.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  return null;
}
