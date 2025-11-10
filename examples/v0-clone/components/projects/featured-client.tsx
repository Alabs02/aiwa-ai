"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { ProjectCardSkeleton } from "@/components/projects/card-skeleton";

type VisibilityFilter = "all" | "public" | "private" | "team";

interface FeaturedChat {
  id: string;
  title?: string;
  demo?: string;
  visibility?: string;
  preview_url?: string;
  demo_url?: string;
  owner_id?: string;
  owner_email?: string;
  owner_name?: string;
  created_at?: string;
  messages?: any[];
  latestVersion?: {
    createdAt: string;
    id: string;
    object: string;
    status: string;
    updatedAt: string;
    demoUrl: string;
  };
}

interface FeaturedClientProps {
  isAuthenticated?: boolean;
}

export function FeaturedClient({
  isAuthenticated = false
}: FeaturedClientProps) {
  const [activeFilter, setActiveFilter] = useState<VisibilityFilter>("all");
  const [chats, setChats] = useState<FeaturedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const limit = 12;
  const debouncedSearch = useDebounce(searchInput, 500);

  // Fetch chats function
  const fetchChats = useCallback(
    async (
      visibility: VisibilityFilter,
      currentOffset: number,
      reset = false,
      search?: string
    ) => {
      try {
        if (reset) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params = new URLSearchParams({
          visibility,
          limit: limit.toString(),
          offset: currentOffset.toString()
        });

        if (search && search.trim()) {
          params.set("search", search.trim());
        }

        const response = await fetch(`/api/chats/featured?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch featured chats");
        }

        const data = await response.json();

        if (reset) {
          setChats(data.data || []);
        } else {
          setChats((prev) => [...prev, ...(data.data || [])]);
        }

        setHasMore(data.pagination?.hasMore || false);
        setTotalCount(data.pagination?.total || 0);
      } catch (error) {
        console.error("Error fetching featured chats:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [limit]
  );

  // Reset when filter or search changes
  useEffect(() => {
    setOffset(0);
    fetchChats(activeFilter, 0, true, debouncedSearch);
  }, [activeFilter, debouncedSearch, fetchChats]);

  // Load more handler
  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchChats(activeFilter, newOffset, false, debouncedSearch);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput("");
  };

  // Determine available filters based on authentication
  const filters: Array<{
    value: VisibilityFilter;
    label: string;
    disabled?: boolean;
    badge?: string;
  }> = isAuthenticated
    ? [
        { value: "all", label: "All" },
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
        { value: "team", label: "Team", disabled: true, badge: "Soon" }
      ]
    : [{ value: "public", label: "Public" }];

  // Auto-switch to public for anonymous users
  useEffect(() => {
    if (!isAuthenticated && activeFilter !== "public") {
      setActiveFilter("public");
    }
  }, [isAuthenticated, activeFilter]);

  return (
    <div className="dark:bg-background min-h-[calc(100vh-60px)] w-full">
      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading mb-2 text-4xl font-bold text-white md:text-5xl">
            Projects
          </h1>
          <p className="font-body text-lg text-neutral-400">
            {isAuthenticated
              ? "Discover and manage your projects"
              : "Explore what the community is building"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search projects by title, description, or creator..."
              className="font-body w-full rounded-lg border border-neutral-800 bg-neutral-900 py-3 pr-12 pl-12 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 focus:outline-none"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-neutral-400 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() =>
                  !filter.disabled && setActiveFilter(filter.value)
                }
                disabled={filter.disabled}
                className={`font-button relative rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.value
                    ? "bg-white text-black"
                    : filter.disabled
                      ? "cursor-not-allowed bg-neutral-800/50 text-neutral-500"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {filter.label}
                {filter.badge && (
                  <span className="ml-2 rounded bg-neutral-700 px-1.5 py-0.5 text-xs">
                    {filter.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Results count */}
          {!isLoading && (
            <div className="font-body ml-auto text-sm whitespace-nowrap text-neutral-500">
              {totalCount} {totalCount === 1 ? "project" : "projects"}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900">
              <Search className="h-8 w-8 text-neutral-600" />
            </div>
            <p className="font-heading mb-2 text-xl font-medium text-white">
              No projects found
            </p>
            <p className="font-body text-neutral-400">
              {searchInput
                ? "Try adjusting your search or filters"
                : "Be the first to share a project!"}
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {chats.map((chat) => (
                <ProjectCard key={chat.id} chat={chat} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="font-button flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// Helper function to generate title from chat
function generateTitle(chat: FeaturedChat): string {
  if (chat.title) return chat.title;

  if (chat.messages && chat.messages.length > 0) {
    const firstUserMessage = chat.messages.find(
      (msg: any) => msg.role === "user"
    );
    if (firstUserMessage?.content) {
      const content =
        typeof firstUserMessage.content === "string"
          ? firstUserMessage.content
          : firstUserMessage.content[0]?.text || "";

      return content.length > 50
        ? content.substring(0, 50).trim() + "..."
        : content;
    }
  }

  return `Project ${chat.id.slice(0, 8)}`;
}

// Helper to get user display name
function getUserDisplayName(chat: FeaturedChat): string {
  if (chat.owner_name) return chat.owner_name;
  if (chat.owner_email) {
    const username = chat.owner_email.split("@")[0];
    return username
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Anonymous";
}

// Helper to get initials for avatar
function getUserInitials(chat: FeaturedChat): string {
  const name = getUserDisplayName(chat);
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ProjectCard({ chat }: { chat: FeaturedChat }) {
  const [imageError, setImageError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const hasPreview = chat.preview_url && !imageError;
  const canShowIframe =
    chat.latestVersion?.demoUrl || chat.demo_url || chat.demo;
  const displayTitle = generateTitle(chat);
  const displayName = getUserDisplayName(chat);
  const initials = getUserInitials(chat);

  return (
    <Link
      href={`/chats/${chat.id}`}
      className="group block overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-600 hover:shadow-xl hover:shadow-neutral-900/50"
    >
      {/* Preview/Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-neutral-800">
        {hasPreview ? (
          <Image
            src={chat.preview_url!}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : canShowIframe ? (
          <div className="[&>iframe]:scrollbar-hide project-iframe-container relative h-full w-full overflow-hidden">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
              </div>
            )}
            <iframe
              src={chat.latestVersion?.demoUrl || chat.demo_url || chat.demo}
              className="project-iframe pointer-events-none h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIframeLoaded(true)}
              style={{
                transform: "scale(0.5)",
                transformOrigin: "top left",
                width: "200%",
                height: "200%",
                overflow: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}
              title={displayTitle}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="font-heading text-4xl font-bold text-neutral-700">
              {chat.id.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* Visibility Badge */}
        {chat.visibility && chat.visibility !== "public" && (
          <div className="absolute top-2 right-2">
            <span className="font-body rounded-md border border-neutral-700 bg-black/80 px-2 py-1 text-xs font-medium text-white capitalize backdrop-blur-sm">
              {chat.visibility}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading mb-1 line-clamp-2 text-lg font-medium text-white transition-colors group-hover:text-neutral-200">
          {displayTitle}
        </h3>
        <p className="font-body mb-3 text-sm text-neutral-500">
          Created{" "}
          {chat.created_at
            ? new Date(chat.created_at).toLocaleDateString()
            : "recently"}
        </p>

        {/* Creator Attribution */}
        <div className="font-body flex items-center gap-2 border-t border-neutral-800 pt-2">
          <div className="font-body flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-xs font-medium text-neutral-400">
            {initials}
          </div>
          <span className="text-sm text-neutral-500">
            by <span className="text-neutral-400">{displayName}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
