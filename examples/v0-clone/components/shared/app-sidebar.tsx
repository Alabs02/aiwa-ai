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
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import {
  IconFolders,
  IconTemplate,
  IconMessage,
  IconSearch,
  IconLayoutDashboard
} from "@tabler/icons-react";
import { SearchDialog } from "../dialogs/search-dialog";

// LocalStorage key for sidebar state
const SIDEBAR_STATE_KEY = "aiwa-sidebar-collapsed";

// Maximum recent chats to display
const MAX_RECENT_CHATS = 5;
const MAX_COLLAPSED_CHATS = 5;

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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    } else {
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
          setRecentChats(data.data || []);
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

    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", { detail: { collapsed: newState } })
    );
  };

  // Handle new chat navigation
  const handleNewChat = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.location.href = "/?reset=true";
    }
    router.push("/");
  };

  // Navigation handlers
  const handleSearch = () => setIsSearchOpen(true);
  const handleWorkspace = () => router.push("/workspace");
  const handleProjects = () => router.push("/projects");
  const handleTemplates = () => router.push("/templates");

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

  // Determine which chats to show
  const displayedChats = isCollapsed
    ? recentChats.slice(0, MAX_COLLAPSED_CHATS)
    : recentChats.slice(0, MAX_RECENT_CHATS);
  const hasMoreChats =
    recentChats.length > (isCollapsed ? MAX_COLLAPSED_CHATS : MAX_RECENT_CHATS);

  return (
    <aside
      className={cn(
        "fixed top-[60px] bottom-0 left-0 z-40",
        "bg-background/85 border-r border-l !border-r-white/[0.08] brightness-105",
        "transition-all duration-300 ease-in-out",
        "flex flex-col",
        "backdrop-blur-2xl backdrop-saturate-150",
        "hidden md:flex",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Sidebar Header with Toggle */}
      <div className="flex items-center justify-end border-b border-white/[0.05] p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-8 w-8 text-white/60 hover:text-white/90",
            "transition-colors hover:bg-white/[0.08]",
            isCollapsed && "mx-auto"
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
                    "w-[calc(100%-14px)] transition-all duration-200",
                    "group",
                    isCollapsed && "size-9 justify-center px-0"
                  )}
                >
                  <Plus className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:rotate-90" />
                  {!isCollapsed && (
                    <span className="font-medium">New Chat</span>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="text-background font-medium"
                >
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
                    "w-[calc(100%-14px)] transition-all duration-200",
                    isCollapsed && "size-9 justify-center px-0"
                  )}
                >
                  <IconSearch className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium">Search</span>
                      <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border border-white/10 bg-white/[0.05] px-1.5 font-mono text-[10px] font-medium text-white/40 opacity-100 select-none sm:flex">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="text-background font-medium"
                >
                  Search (⌘K)
                </TooltipContent>
              )}
            </Tooltip>

            {/* Divider */}
            <div className="my-2 border-t border-white/[0.08]" />

            {/* Workspace Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleWorkspace}
                  className={cn(
                    "w-full justify-start gap-3",
                    "text-white/80 hover:text-white",
                    "hover:bg-white/[0.08]",
                    "w-[calc(100%-14px)] transition-all duration-200",
                    pathname === "/workspace" && "bg-white/[0.12] text-white",
                    isCollapsed && "size-9 justify-center px-0"
                  )}
                >
                  <IconLayoutDashboard className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">Workspace</span>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="text-background font-medium"
                >
                  Workspace
                </TooltipContent>
              )}
            </Tooltip>

            {/* Projects Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleProjects}
                  className={cn(
                    "w-full justify-start gap-3",
                    "text-white/80 hover:text-white",
                    "hover:bg-white/[0.08]",
                    "w-[calc(100%-14px)] transition-all duration-200",
                    pathname === "/projects" && "bg-white/[0.12] text-white",
                    isCollapsed && "size-9 justify-center px-0"
                  )}
                >
                  <IconFolders className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">Projects</span>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="text-background font-medium"
                >
                  Projects
                </TooltipContent>
              )}
            </Tooltip>

            {/* Templates Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleTemplates}
                  className={cn(
                    "w-full justify-start gap-3",
                    "text-white/80 hover:text-white",
                    "hover:bg-white/[0.08]",
                    "w-[calc(100%-14px)] transition-all duration-200",
                    pathname === "/templates" && "bg-white/[0.12] text-white",
                    isCollapsed && "size-9 justify-center px-0"
                  )}
                >
                  <IconTemplate className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">Templates</span>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="text-background font-medium"
                >
                  Templates
                </TooltipContent>
              )}
            </Tooltip>

            {/* Recent Chats Divider */}
            {session?.user?.id && displayedChats.length > 0 && (
              <div className="my-4 border-t border-white/[0.08]" />
            )}

            {/* Recent Chats Section - Expanded */}
            {session?.user?.id && !isCollapsed && (
              <div className="space-y-1">
                <h3 className="mb-2 px-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
                  Recent Chats
                </h3>
                {isLoadingChats ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  </div>
                ) : displayedChats.length > 0 ? (
                  <>
                    {displayedChats.map((chat) => {
                      const isActive = pathname === `/chats/${chat.id}`;
                      return (
                        <Link
                          key={chat.id}
                          href={`/chats/${chat.id}`}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-2 py-2",
                            "text-sm text-white/70 hover:text-white",
                            "hover:bg-white/[0.08]",
                            "transition-all duration-200",
                            "group w-[calc(100%-14px)]",
                            isActive && "bg-white/[0.12] text-white"
                          )}
                        >
                          <IconMessage className="h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="inline-block max-w-[90%] truncate font-medium">
                              {getChatDisplayName(chat)}
                            </p>
                            <p className="text-xs text-white/40">
                              {getRelativeTime(
                                chat.updatedAt || chat.createdAt
                              )}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                    {/* View All Button */}
                    {hasMoreChats && (
                      <Link
                        href="/workspace"
                        className={cn(
                          "mt-2 flex items-center justify-center gap-2 rounded-md px-2 py-2",
                          "text-sm text-white/60 hover:text-white",
                          "hover:bg-white/[0.08]",
                          "transition-all duration-200",
                          "group w-[calc(100%-14px)] border border-dashed border-white/[0.08]"
                        )}
                      >
                        <span className="font-medium">View All Chats</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </>
                ) : (
                  <p className="px-2 py-4 text-center text-xs text-white/40">
                    No recent chats
                  </p>
                )}
              </div>
            )}

            {/* Recent Chats Section - Collapsed */}
            {session?.user?.id && isCollapsed && displayedChats.length > 0 && (
              <div className="space-y-1">
                {displayedChats.map((chat) => {
                  const isActive = pathname === `/chats/${chat.id}`;
                  return (
                    <Tooltip key={chat.id}>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/chats/${chat.id}`}
                          className={cn(
                            "flex items-center justify-center",
                            "mx-auto size-9 rounded-md",
                            "text-white/70 hover:text-white",
                            "hover:bg-white/[0.08]",
                            "transition-all duration-200",
                            isActive && "bg-white/[0.12] text-white"
                          )}
                        >
                          <IconMessage className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="text-background font-medium">
                            {getChatDisplayName(chat)}
                          </p>
                          <p className="text-background/70 text-xs">
                            {getRelativeTime(chat.updatedAt || chat.createdAt)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {/* View All Button - Collapsed */}
                {hasMoreChats && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/workspace"
                        className={cn(
                          "flex items-center justify-center",
                          "mx-auto mt-2 size-9 rounded-md",
                          "text-white/60 hover:text-white",
                          "hover:bg-white/[0.08]",
                          "transition-all duration-200",
                          "border border-dashed border-white/[0.08]"
                        )}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="text-background font-medium"
                    >
                      View All Chats
                    </TooltipContent>
                  </Tooltip>
                )}
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
