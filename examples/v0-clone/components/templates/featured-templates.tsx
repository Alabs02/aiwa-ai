"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader } from "lucide-react";
import { FeaturedTemplatesSkeleton } from "./card-skeleton";
import { MagicCard } from "@/components/ui/magic-card";

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

export function FeaturedTemplates() {
  const [chats, setChats] = useState<FeaturedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 6;

  useEffect(() => {
    fetchChats(0, true);
  }, []);

  const fetchChats = async (currentOffset: number, reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/chats/featured?visibility=public&limit=${limit}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch community templates");
      }

      const data = await response.json();

      if (reset) {
        setChats(data.data || []);
      } else {
        setChats((prev) => [...prev, ...(data.data || [])]);
      }

      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error("Error fetching community templates:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchChats(newOffset, false);
  };

  return (
    <section className="bg-background/25 border-foreground/5 mx-auto mt-6 mb-12 w-full max-w-7xl rounded-lg border px-4 py-16 backdrop-blur-sm md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-heading mb-2 text-3xl font-bold text-white md:text-4xl">
            From the Community
          </h2>
          <p className="font-body text-neutral-400">
            Discover what the community is building with Aiwa
          </p>
        </div>
        <Link
          href="/featured"
          className="font-button rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          View All
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <FeaturedTemplatesSkeleton count={6} />
      ) : chats.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-body text-lg text-neutral-400">
            No community projects yet. Be the first to share!
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
        </div>

        {/* Content */}
        <div className="bg-neutral-900/90 p-4">
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
      </MagicCard>
    </Link>
  );
}
