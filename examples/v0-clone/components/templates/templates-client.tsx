"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader, Search } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type SortByOption = "last_edited" | "date_created" | "alphabetical";
type OrderByOption = "desc" | "asc";

interface Template {
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
    demoUrl: string;
  };
}

export function TemplatesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortByOption>("last_edited");
  const [orderBy, setOrderBy] = useState<OrderByOption>("desc");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 12;

  useEffect(() => {
    setOffset(0);
    fetchTemplates(sortBy, orderBy, searchQuery, 0, true);
  }, [sortBy, orderBy, searchQuery]);

  const fetchTemplates = async (
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
        visibility: "public",
        limit: limit.toString(),
        offset: currentOffset.toString()
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(`/api/chats/featured?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();

      if (reset) {
        setTemplates(data.data || []);
      } else {
        setTemplates((prev) => [...prev, ...(data.data || [])]);
      }

      setHasMore(data.pagination?.hasMore || false);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchTemplates(sortBy, orderBy, searchQuery, newOffset, false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading mb-2 text-4xl font-bold text-white md:text-5xl">
          Community Templates
        </h1>
        <p className="font-body text-lg text-neutral-400">
          Discover and remix {totalCount > 0 ? `${totalCount} ` : ""}projects
          built with Aiwa
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="text"
            placeholder="Search templates..."
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
      </div>

      {/* Loading State */}
      {isLoading ? (
        <TemplatesSkeleton count={12} />
      ) : templates.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-body text-lg text-neutral-400">
            {searchQuery
              ? "No templates match your search"
              : "No templates available yet. Be the first to share!"}
          </p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
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
    </div>
  );
}

// Helper functions
function generateTitle(template: Template): string {
  if (template.title) return template.title;

  if (template.messages && template.messages.length > 0) {
    const firstUserMessage = template.messages.find(
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

  return `Project ${template.id.slice(0, 8)}`;
}

function getUserDisplayName(template: Template): string {
  if (template.owner_name) return template.owner_name;
  if (template.owner_email) {
    const username = template.owner_email.split("@")[0];
    return username
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Anonymous";
}

function getUserInitials(template: Template): string {
  const name = getUserDisplayName(template);
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TemplateCard({ template }: { template: Template }) {
  const [imageError, setImageError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const hasPreview = template.preview_url && !imageError;
  const canShowIframe =
    template.latestVersion?.demoUrl || template.demo_url || template.demo;
  const displayTitle = generateTitle(template);
  const displayName = getUserDisplayName(template);
  const initials = getUserInitials(template);

  return (
    <Link href={`/chats/${template.id}`} prefetch>
      <MagicCard
        gradientFrom="#9E7AFF"
        gradientTo="#f9a862"
        className="group rounded-lg p-1"
      >
        {/* Preview/Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-neutral-800">
          {hasPreview ? (
            <Image
              src={template.preview_url!}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : canShowIframe ? (
            <div className="relative h-full w-full overflow-hidden">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                  <Loader className="h-6 w-6 animate-spin text-neutral-600" />
                </div>
              )}
              <iframe
                src={
                  template.latestVersion?.demoUrl ||
                  template.demo_url ||
                  template.demo
                }
                className="pointer-events-none h-full w-full border-0"
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
                {template.id.slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="rounded-b-lg bg-neutral-900/90 p-4">
          <h3 className="font-heading mb-1 line-clamp-2 text-base font-medium text-white transition-colors group-hover:text-neutral-200">
            {displayTitle}
          </h3>
          <p className="font-body mb-3 text-xs text-neutral-500">
            Created{" "}
            {template.created_at
              ? new Date(template.created_at).toLocaleDateString()
              : "recently"}
          </p>

          {/* Creator Attribution */}
          <div className="font-body flex items-center gap-2 border-t border-neutral-800 pt-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-xs font-medium text-neutral-400">
              {initials}
            </div>
            <span className="text-xs text-neutral-500">
              by <span className="text-neutral-400">{displayName}</span>
            </span>
          </div>
        </div>
      </MagicCard>
    </Link>
  );
}

function TemplatesSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg bg-neutral-900/50 p-0.5">
          <div className="aspect-video animate-pulse rounded-t-lg bg-neutral-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
            <div className="flex items-center gap-2 border-t border-neutral-800 pt-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-800" />
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
