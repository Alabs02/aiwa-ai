"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Library,
  Search,
  Star,
  Trash2,
  Copy,
  Check,
  Loader,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface PromptLibraryItem {
  id: string;
  prompt_text: string;
  enhanced_prompt?: string | null;
  title?: string | null;
  category?: string | null;
  quality_score?: string | null;
  is_favorite: string;
  usage_count: number;
  created_at: string;
}

interface PromptLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt: (prompt: string) => void;
}

export function PromptLibraryDialog({
  open,
  onOpenChange,
  onSelectPrompt
}: PromptLibraryDialogProps) {
  const [prompts, setPrompts] = useState<PromptLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPrompts();
    }
  }, [open, activeTab]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "favorites") {
        params.append("favorites", "true");
      }
      if (searchQuery) {
        params.append("q", searchQuery);
      }

      const response = await fetch(`/api/prompts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      toast.error("Failed to load prompts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPrompts();
  };

  const handleToggleFavorite = async (
    promptId: string,
    isFavorite: boolean
  ) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite })
      });

      if (response.ok) {
        setPrompts(
          prompts.map((p) =>
            p.id === promptId
              ? { ...p, is_favorite: !isFavorite ? "true" : "false" }
              : p
          )
        );
        toast.success(
          !isFavorite ? "Added to favorites" : "Removed from favorites"
        );
      }
    } catch (error) {
      toast.error("Failed to update favorite");
    }
  };

  const handleDelete = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setPrompts(prompts.filter((p) => p.id !== promptId));
        toast.success("Prompt deleted");
      }
    } catch (error) {
      toast.error("Failed to delete prompt");
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleUsePrompt = async (prompt: PromptLibraryItem) => {
    const textToUse = prompt.enhanced_prompt || prompt.prompt_text;
    onSelectPrompt(textToUse);
    onOpenChange(false);

    // Increment usage count
    try {
      await fetch(`/api/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "increment_usage" })
      });
    } catch (error) {
      console.error("Failed to increment usage:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass border-white/[0.12]",
          "max-h-[85vh] max-w-3xl",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          "p-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/[0.08] p-6">
            <div className="flex items-center gap-3">
              <div className="from-primary/20 rounded-lg bg-gradient-to-br to-purple-500/20 p-2">
                <Library className="text-primary-foreground h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Prompt Library
                </h2>
                <p className="text-sm text-white/60">
                  Browse and reuse your saved prompts
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search your prompts..."
                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1"
          >
            <div className="border-b border-white/[0.08] px-6">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white/10"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="data-[state=active]:bg-white/10"
                >
                  Favorites
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="m-0 flex-1">
              <ScrollArea className="h-[calc(85vh-240px)]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-white/40" />
                  </div>
                ) : prompts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <Library className="mb-3 h-12 w-12 text-white/20" />
                    <p className="mb-1 text-sm text-white/60">
                      {activeTab === "favorites"
                        ? "No favorite prompts yet"
                        : "No saved prompts yet"}
                    </p>
                    <p className="text-xs text-white/40">
                      Save prompts from the enhancer to reuse them later
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {prompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {prompt.title || "Untitled Prompt"}
                            </p>
                            <p className="text-xs text-white/40">
                              {formatDate(prompt.created_at)} • Used{" "}
                              {prompt.usage_count} times
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleToggleFavorite(
                                  prompt.id,
                                  prompt.is_favorite === "true"
                                )
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Star
                                className={cn(
                                  "h-3.5 w-3.5",
                                  prompt.is_favorite === "true"
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "text-white/40"
                                )}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleCopy(
                                  prompt.enhanced_prompt || prompt.prompt_text,
                                  prompt.id
                                )
                              }
                              className="h-8 w-8 p-0"
                            >
                              {copiedId === prompt.id ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-white/40" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(prompt.id)}
                              className="h-8 w-8 p-0 text-white/40 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <p className="mb-3 line-clamp-2 text-xs text-white/60">
                          {prompt.enhanced_prompt || prompt.prompt_text}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {prompt.category && (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                                {prompt.category}
                              </span>
                            )}
                            {prompt.enhanced_prompt && (
                              <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">
                                <Sparkles className="h-3 w-3" />
                                Enhanced
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUsePrompt(prompt)}
                            className="h-7 bg-white/10 text-xs hover:bg-white/20"
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
