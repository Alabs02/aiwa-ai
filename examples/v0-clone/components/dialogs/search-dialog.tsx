"use client";

import "./search-dialog.css";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Clock,
  Folder,
  MessageSquare,
  Loader
} from "lucide-react";

interface Chat {
  id: string;
  name?: string;
  privacy?: "public" | "private" | "team" | "team-edit" | "unlisted";
  createdAt: string;
  updatedAt?: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Get chat display name
  const getChatDisplayName = (chat: Chat): string => {
    return chat.name || `Chat ${chat.id.slice(0, 8)}...`;
  };

  // Quick actions
  const quickActions = [
    {
      icon: Plus,
      label: "New Chat",
      action: () => {
        onOpenChange(false);
        router.push("/");
      }
    },
    {
      icon: Clock,
      label: "All Recent Chats",
      action: () => {
        onOpenChange(false);
        router.push("/chats");
      }
    },
    {
      icon: Folder,
      label: "Templates",
      action: () => {
        onOpenChange(false);
        router.push("/templates");
      }
    }
  ];

  // Search function with debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If no query, fetch recent chats
      setIsLoading(true);
      try {
        const response = await fetch("/api/chats");
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data?.slice(0, 10) || []);
        }
      } catch (error) {
        console.error("Failed to fetch recent chats:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/chats/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open, performSearch]);

  // Load recent chats on open
  useEffect(() => {
    if (open && searchQuery === "") {
      performSearch("");
    }
  }, [open, performSearch]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      const totalItems = quickActions.length + searchResults.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex < quickActions.length) {
            quickActions[selectedIndex].action();
          } else {
            const chatIndex = selectedIndex - quickActions.length;
            const chat = searchResults[chatIndex];
            if (chat) {
              onOpenChange(false);
              router.push(`/chats/${chat.id}`);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, quickActions, searchResults, router, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass-strong border-white/[0.12]",
          "gap-0 overflow-hidden p-0",
          "max-w-2xl",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        )}
      >
        {/* Search Input */}
        <div className="border-b border-white/[0.08] p-4 !pt-7">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a command or search..."
              className={cn(
                "h-12 pl-11 text-base",
                "border-white/[0.08] bg-white/[0.03]",
                "focus:border-white/[0.15] focus:bg-white/[0.05]",
                "placeholder:text-white/40",
                "transition-all duration-200"
              )}
              autoFocus
            />
            {isLoading && (
              <Loader className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />
            )}
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {/* Quick Actions */}
            {searchQuery === "" && (
              <div className="mb-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const isSelected = selectedIndex === index;
                  return (
                    <button
                      key={action.label}
                      onClick={action.action}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5",
                        "text-white/80 hover:text-white",
                        "transition-all duration-150",
                        isSelected
                          ? "bg-white/[0.12] text-white"
                          : "hover:bg-white/[0.08]"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Recent Chats Section */}
            {searchResults.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
                  {searchQuery ? "Search Results" : "Recent Chats"}
                </h3>
                <div className="space-y-1">
                  {searchResults.map((chat, index) => {
                    const globalIndex = quickActions.length + index;
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <button
                        key={chat.id}
                        onClick={() => {
                          onOpenChange(false);
                          router.push(`/chats/${chat.id}`);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2.5",
                          "text-left transition-all duration-150",
                          isSelected
                            ? "bg-white/[0.12]"
                            : "hover:bg-white/[0.08]"
                        )}
                      >
                        <MessageSquare
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isSelected ? "text-white" : "text-white/60"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate font-medium",
                              isSelected ? "text-white" : "text-white/80"
                            )}
                          >
                            {getChatDisplayName(chat)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-white/40">
                          {formatRelativeTime(chat.updatedAt || chat.createdAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && searchResults.length === 0 && searchQuery !== "" && (
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto mb-3 h-12 w-12 text-white/20" />
                <p className="mb-1 text-sm text-white/60">No chats found</p>
                <p className="text-xs text-white/40">
                  Try a different search term
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && searchResults.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Loader className="mx-auto mb-3 h-8 w-8 animate-spin text-white/40" />
                <p className="text-sm text-white/60">Searching...</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2 text-xs text-white/40">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-white/60">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-white/60">
                ↵
              </kbd>{" "}
              Select
            </span>
          </div>
          <span>
            <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-white/60">
              Esc
            </kbd>{" "}
            Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
