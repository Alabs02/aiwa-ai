"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  Folder,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SearchDialog } from "../dialogs/search-dialog";

// LocalStorage key for sidebar state
const SIDEBAR_STATE_KEY = "aiwa-sidebar-collapsed";

interface Chat {
  id: string;
  name?: string;
  privacy?: "public" | "private" | "team" | "team-edit" | "unlisted";
  createdAt: string;
  updatedAt?: string;
}

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    } else {
      // Set default collapsed state in localStorage
      localStorage.setItem(SIDEBAR_STATE_KEY, "true");
    }
  }, []);

  // Global Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch recent chats when user is authenticated
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchRecentChats = async () => {
      setIsLoadingChats(true);
      try {
        const response = await fetch("/api/chats");
        if (response.ok) {
          const data = await response.json();
          // Get the 10 most recent chats
          const chats = (data.data || []).slice(0, 10);
          setRecentChats(chats);
        }
      } catch (error) {
        console.error("Failed to fetch recent chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchRecentChats();
  }, [session?.user?.id]);

  // Toggle sidebar collapse state and save to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_STATE_KEY, String(newState));

    // Dispatch custom event for same-tab synchronization
    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", { detail: { collapsed: newState } }),
    );
  };

  // Handle new chat navigation
  const handleNewChat = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      // Add reset parameter to trigger UI reset
      window.location.href = "/?reset=true";
    }

    router.push("/");
  };

  // Handle search click (will trigger dialog)
  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  // Handle featured projects navigation
  const handleFeaturedProjects = () => {
    router.push("/projects");
  };

  // Format chat display name
  const getChatDisplayName = (chat: Chat): string => {
    return chat.name || `Chat ${chat.id.slice(0, 8)}...`;
  };

  // Format relative time
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-[60px] bottom-0 z-40",
        "bg-background/85 brightness-105 border-r border-l !border-r-white/[0.08]",
        "transition-all duration-300 ease-in-out",
        "flex flex-col",
        "backdrop-blur-2xl backdrop-saturate-150",
        // Hide on mobile by default
        "hidden md:flex",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Sidebar Header with Toggle */}
      <div className="flex items-center justify-end p-4 border-b border-white/[0.05]">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-8 w-8 text-white/60 hover:text-white/90",
            "hover:bg-white/[0.08] transition-colors",
            isCollapsed && "mx-auto",
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar Content */}
      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider delayDuration={300}>
          <nav className="space-y-2">
            {/* New Chat Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleNewChat}
                  className={cn(
                    "w-full justify-start gap-3",
                    "text-white/80 hover:text-white",
                    "hover:bg-white/[0.08]",
                    "transition-all duration-200",
                    "group",
                    isCollapsed && "justify-center px-0",
                  )}
                >
                  <Plus className="h-5 w-5 shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                  {!isCollapsed && (
                    <span className="font-medium">New Chat</span>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  New Chat
                </TooltipContent>
              )}
            </Tooltip>

            {/* Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleSearch}
                  className={cn(
                    "w-full justify-start gap-3",
                    "text-white/80 hover:text-white",
                    "hover:bg-white/[0.08]",
                    "transition-all duration-200",
                    isCollapsed && "justify-center px-0",
                  )}
                >
                  <Search className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="font-medium">Search</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Search
                </TooltipContent>
              )}
            </Tooltip>

            {/* Featured Projects Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleFeaturedProjects}
                  className={cn(
                    "w-full justify-start gap-3",
                    "text-white/80 hover:text-white",
                    "hover:bg-white/[0.08]",
                    "transition-all duration-200",
                    isCollapsed && "justify-center px-0",
                  )}
                >
                  <Folder className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">Featured Projects</span>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Featured Projects
                </TooltipContent>
              )}
            </Tooltip>

            {/* Divider */}
            {session?.user?.id && recentChats.length > 0 && (
              <div className="my-4 border-t border-white/[0.08]" />
            )}

            {/* Recent Chats Section */}
            {session?.user?.id && !isCollapsed && (
              <div className="space-y-1">
                <h3 className="px-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Recent Chats
                </h3>
                {isLoadingChats ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  </div>
                ) : recentChats.length > 0 ? (
                  recentChats.map((chat) => {
                    const isActive = pathname === `/chats/${chat.id}`;
                    return (
                      <Link
                        key={chat.id}
                        href={`/chats/${chat.id}`}
                        className={cn(
                          "flex items-center gap-3 px-2 py-2 rounded-md",
                          "text-sm text-white/70 hover:text-white",
                          "hover:bg-white/[0.08]",
                          "transition-all duration-200",
                          "group",
                          isActive && "bg-white/[0.12] text-white",
                        )}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">
                            {getChatDisplayName(chat)}
                          </p>
                          <p className="text-xs text-white/40">
                            {getRelativeTime(chat.updatedAt || chat.createdAt)}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-2 text-xs text-white/40 text-center py-4">
                    No recent chats
                  </p>
                )}
              </div>
            )}

            {/* Collapsed Recent Chats (Icons Only) */}
            {session?.user?.id && isCollapsed && recentChats.length > 0 && (
              <div className="space-y-1">
                {recentChats.slice(0, 5).map((chat) => {
                  const isActive = pathname === `/chats/${chat.id}`;
                  return (
                    <Tooltip key={chat.id}>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/chats/${chat.id}`}
                          className={cn(
                            "flex items-center justify-center",
                            "h-10 w-10 mx-auto rounded-md",
                            "text-white/70 hover:text-white",
                            "hover:bg-white/[0.08]",
                            "transition-all duration-200",
                            isActive && "bg-white/[0.12] text-white",
                          )}
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium text-background">
                            {getChatDisplayName(chat)}
                          </p>
                          <p className="text-xs text-background/70">
                            {getRelativeTime(chat.updatedAt || chat.createdAt)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </aside>
  );
}
