"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader, Search, ChevronDown } from "lucide-react";
import { FeaturedTemplatesSkeleton } from "./card-skeleton";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type VisibilityFilter = "all" | "private" | "team";
type SortByOption = "last_edited" | "date_created" | "alphabetical";
type OrderByOption = "desc" | "asc";

interface UserChat {
  id: string;
  title?: string;
  demo?: string;
  visibility?: string;
  preview_url?: string;
  demo_url?: string;
  owner_id?: string;
  owner_email?: string;
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

interface UserTemplatesProps {
  userName?: string;
  userEmail?: string;
}

export function UserTemplates({ userName, userEmail }: UserTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<VisibilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortByOption>("last_edited");
  const [orderBy, setOrderBy] = useState<OrderByOption>("desc");
  const [chats, setChats] = useState<UserChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 8; // Show fewer items in user's section

  // Get display name for section title
  const displayName = userName || userEmail?.split("@")[0] || "My";

  useEffect(() => {
    setOffset(0);
    fetchChats(activeFilter, sortBy, orderBy, searchQuery, 0, true);
  }, [activeFilter, sortBy, orderBy, searchQuery]);

  const fetchChats = async (
    visibility: VisibilityFilter,
    sort: SortByOption,
    order: OrderByOption,
    search: string,
    currentOffset: number,
    reset = false
  ) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams({
        visibility,
        sortBy: sort,
        orderBy: order,
        limit: limit.toString(),
        offset: currentOffset.toString()
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(`/api/chats/my-chats?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch your projects");
      }

      const data = await response.json();

      if (reset) {
        setChats(data.data || []);
      } else {
        setChats((prev) => [...prev, ...(data.data || [])]);
      }

      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error("Error fetching user projects:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchChats(activeFilter, sortBy, orderBy, searchQuery, newOffset, false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <section className="bg-background/25 border-foreground/5 mx-auto w-full max-w-7xl rounded-lg border px-4 py-16 backdrop-blur-sm md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-heading mb-2 text-3xl font-bold text-white capitalize md:text-4xl">
            Your Creations
          </h2>
          <p className="font-body text-neutral-400">
            Your web apps and prototypes
          </p>
        </div>
        <Link
          href="/workspace"
          className="font-button rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          View All
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="text"
            placeholder="Search your projects..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="border-neutral-800 bg-neutral-900/50 pl-9 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Sort By */}
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortByOption)}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/50 text-white md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-900">
            <SelectItem
              value="last_edited"
              className="text-white hover:bg-neutral-800"
            >
              Last Edited
            </SelectItem>
            <SelectItem
              value="date_created"
              className="text-white hover:bg-neutral-800"
            >
              Date Created
            </SelectItem>
            <SelectItem
              value="alphabetical"
              className="text-white hover:bg-neutral-800"
            >
              Alphabetical
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Order By */}
        <Select
          value={orderBy}
          onValueChange={(v) => setOrderBy(v as OrderByOption)}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900/50 text-white md:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-900">
            <SelectItem
              value="desc"
              className="text-white hover:bg-neutral-800"
            >
              Newest First
            </SelectItem>
            <SelectItem value="asc" className="text-white hover:bg-neutral-800">
              Oldest First
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Visibility Filter */}
        <div className="flex gap-2">
          {(["all", "private", "team"] as VisibilityFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`font-button rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap capitalize transition-all ${
                activeFilter === filter
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <FeaturedTemplatesSkeleton count={4} />
      ) : chats.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-body text-lg text-neutral-400">
            {searchQuery
              ? "No projects match your search"
              : "No projects yet. Start building to see them here!"}
          </p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    <Loader className="h-4 w-4 animate-spin" />
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
  );
}

// Helper functions
function generateTitle(chat: UserChat): string {
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

function ProjectCard({ chat }: { chat: UserChat }) {
  const [imageError, setImageError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const hasPreview = chat.preview_url && !imageError;
  const canShowIframe =
    chat.latestVersion?.demoUrl || chat.demo_url || chat.demo;
  const displayTitle = generateTitle(chat);

  return (
    <Link href={`/chats/${chat.id}`} prefetch passHref>
      <MagicCard
        gradientFrom="#9E7AFF"
        gradientTo="#f9a862"
        className="group rounded-lg p-0.5"
      >
        {/* Preview/Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-neutral-800">
          {hasPreview ? (
            <Image
              src={chat.preview_url!}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : canShowIframe ? (
            <div className="project-iframe-container relative h-full w-full overflow-hidden">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                  <Loader className="h-6 w-6 animate-spin text-neutral-600" />
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
          {chat.visibility && chat.visibility !== "private" && (
            <div className="absolute top-2 right-2">
              <span className="font-body rounded-md border border-neutral-700 bg-black/80 px-2 py-1 text-xs font-medium text-white capitalize backdrop-blur-sm">
                {chat.visibility}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-neutral-900/90 p-4">
          <h3 className="font-heading mb-1 line-clamp-2 text-base font-medium text-white transition-colors group-hover:text-neutral-200">
            {displayTitle}
          </h3>
          <p className="font-body text-xs text-neutral-500">
            {chat.created_at
              ? new Date(chat.created_at).toLocaleDateString()
              : "Recently"}
          </p>
        </div>
      </MagicCard>
    </Link>
  );
}
