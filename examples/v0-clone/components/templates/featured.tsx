"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { FeaturedTemplatesSkeleton } from "./card-skeleton";

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

interface FeaturedProjectsProps {
  isAuthenticated?: boolean;
}

export function FeaturedTemplates({
  isAuthenticated = false
}: FeaturedProjectsProps) {
  const [activeFilter, setActiveFilter] = useState<VisibilityFilter>("all");
  const [chats, setChats] = useState<FeaturedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 12;

  useEffect(() => {
    // Reset when filter changes
    setOffset(0);
    fetchChats(activeFilter, 0, true);
  }, [activeFilter]);

  const fetchChats = async (
    visibility: VisibilityFilter,
    currentOffset: number,
    reset = false
  ) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/chats/featured?visibility=${visibility}&limit=${limit}&offset=${currentOffset}`
      );

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
    } catch (error) {
      console.error("Error fetching featured chats:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchChats(activeFilter, newOffset, false);
  };

  // Determine available filters based on authentication
  const filters: Array<{ value: VisibilityFilter; label: string }> =
    isAuthenticated
      ? [
          { value: "all", label: "All" },
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
          { value: "team", label: "Team" }
        ]
      : [{ value: "public", label: "Public" }];

  // Auto-switch to public for anonymous users
  useEffect(() => {
    if (!isAuthenticated && activeFilter !== "public") {
      setActiveFilter("public");
    }
  }, [isAuthenticated, activeFilter]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-heading mb-2 text-3xl font-bold text-white md:text-4xl">
          From the Community
        </h2>
        <p className="font-body text-neutral-400">
          Discover what the community is building with Aiwa
        </p>
      </div>

      {/* Filters */}
      {isAuthenticated && (
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`font-button rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.value
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading State with Skeletons */}
      {isLoading ? (
        <FeaturedTemplatesSkeleton count={6} />
      ) : chats.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-body text-lg text-neutral-400">
            No projects found. Be the first to share!
          </p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chats.map((chat) => (
              <TemplateCard key={chat.id} chat={chat} />
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
    // Extract name from email (e.g., john.doe@example.com -> John Doe)
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

function TemplateCard({ chat }: { chat: FeaturedChat }) {
  const [imageError, setImageError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const hasPreview = chat.preview_url && !imageError;
  const canShowIframe =
    chat.latestVersion?.demoUrl || chat.demo_url || chat.demo;
  const displayTitle = generateTitle(chat);
  const displayName = getUserDisplayName(chat);
  const initials = getUserInitials(chat);

  console.log({ ...chat });

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
          <div className="project-iframe-container relative h-full w-full overflow-hidden">
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
          {/* Avatar */}
          <div className="font-body flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-xs font-medium text-neutral-400">
            {initials}
          </div>

          {/* Creator Name */}
          <span className="text-sm text-neutral-500">
            by <span className="text-neutral-400">{displayName}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
