"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Loader,
  Copy,
  Check,
  BookmarkPlus,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownPreview } from "react-markdown-preview";

interface PromptEnhancerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
  onUsePrompt: (prompt: string) => void;
}

const PROJECT_TYPES = [
  { value: "landing-page", label: "Landing Page" },
  { value: "dashboard", label: "Dashboard" },
  { value: "e-commerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "portfolio", label: "Portfolio" },
  { value: "saas", label: "SaaS Application" },
  { value: "admin-panel", label: "Admin Panel" },
  { value: "custom", label: "Custom" }
];

function cleanLlmOutput(llmText: string): string {
  const trimmedText = llmText.trim();

  if (trimmedText.startsWith("```") && trimmedText.endsWith("```")) {
    const lines = trimmedText.split("\n");

    // Remove the first and last lines (fences)
    const contentLines = lines.slice(1, -1);

    let cleanedContent = contentLines.join("\n");

    return cleanedContent.trim();
  }

  return trimmedText;
}

export function PromptEnhancerDialog({
  open,
  onOpenChange,
  initialPrompt = "",
  onUsePrompt
}: PromptEnhancerDialogProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [context, setContext] = useState("");
  const [projectType, setProjectType] = useState<string>("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setPrompt(initialPrompt);
      setEnhancedPrompt("");
      setContext("");
      setProjectType("");
      setCopied(false);
      setSaved(false);
    }
  }, [open, initialPrompt]);

  const handleEnhance = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to enhance");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch("/api/prompts/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context, projectType })
      });

      if (!response.ok) {
        throw new Error("Failed to enhance prompt");
      }

      const data = await response.json();
      setEnhancedPrompt(data.enhancedPrompt);
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      toast.error("Failed to enhance prompt");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = enhancedPrompt || prompt;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleSave = async () => {
    const promptToSave = enhancedPrompt || prompt;
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: prompt,
          enhancedPrompt: enhancedPrompt || undefined,
          category: projectType || "custom",
          qualityScore: "good"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save prompt");
      }

      setSaved(true);
      toast.success("Saved to your prompt library");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt");
    }
  };

  const handleUse = () => {
    const promptToUse = enhancedPrompt || prompt;
    onUsePrompt(promptToUse);
    onOpenChange(false);
    toast.success("Prompt ready to use");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass from-background/75 via-background/45 to-background/25 bg-gradient-to-br",
          "max-h-[90vh] max-w-4xl overflow-y-auto",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          "p-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/[0.08] p-6">
            <div className="flex items-center gap-3">
              <div className="from-primary/20 rounded-lg bg-gradient-to-br to-purple-500/20 p-2">
                <Wand2 className="text-primary-foreground h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Prompt Enhancer
                </h2>
                <p className="text-sm text-white/60">
                  Transform your idea into a detailed, actionable prompt
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Original Prompt */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Your Idea
                </Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to build... (e.g., 'A landing page for a SaaS product')"
                  className="min-h-[120px] resize-none border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>

              {/* Project Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Project Type (Optional)
                </Label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select a project type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Additional Context (Optional)
                </Label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any specific requirements, design preferences, or features you want to include..."
                  className="min-h-[80px] resize-none border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>

              {/* Enhance Button */}
              <Button
                onClick={handleEnhance}
                disabled={!prompt.trim() || isEnhancing}
                className="text-background w-full bg-neutral-100 hover:bg-neutral-200"
              >
                {isEnhancing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enhance Prompt
                  </>
                )}
              </Button>

              {/* Enhanced Prompt */}
              {enhancedPrompt && (
                <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-white">
                      Enhanced Prompt
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        className="h-8 text-white/60 hover:text-white"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSave}
                        className="h-8 text-white/60 hover:text-white"
                      >
                        {saved ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Saved
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/80">
                    <MarkdownPreview doc={cleanLlmOutput(enhancedPrompt)} />
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-white/[0.08] p-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                className="text-background bg-neutral-100 hover:bg-neutral-200"
                onClick={handleUse}
                disabled={!prompt.trim()}
              >
                Use Prompt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
