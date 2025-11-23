"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader, Search, Plus } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type VisibilityFilter = "all" | "private" | "team";
type SortByOption = "last_edited" | "date_created" | "alphabetical";
type OrderByOption = "desc" | "asc";

interface Project {
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
    demoUrl: string;
  };
}

export function WorkspaceClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<VisibilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortByOption>("last_edited");
  const [orderBy, setOrderBy] = useState<OrderByOption>("desc");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 12;

  useEffect(() => {
    setOffset(0);
    fetchProjects(activeFilter, sortBy, orderBy, searchQuery, 0, true);
  }, [activeFilter, sortBy, orderBy, searchQuery]);

  const fetchProjects = async (
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
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      if (reset) {
        setProjects(data.data || []);
      } else {
        setProjects((prev) => [...prev, ...(data.data || [])]);
      }

      setHasMore(data.pagination?.hasMore || false);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchProjects(activeFilter, sortBy, orderBy, searchQuery, newOffset, false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold text-white md:text-5xl">
            My Workspace
          </h1>
          <p className="font-body text-lg text-neutral-400">
            {totalCount > 0 ? `${totalCount} ` : ""}Project
            {totalCount !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Link href="/">
          <Button className="bg-white text-black hover:bg-neutral-200">
            <Plus className="mr-2 h-4 w-4" />
            New Vibe
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col gap-4">
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

        {/* Filters Row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Visibility Filter Pills */}
          <div className="flex gap-2">
            {(["all", "private", "team"] as VisibilityFilter[]).map(
              (filter) => (
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
              )
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortByOption)}
            >
              <SelectTrigger className="w-[180px] border-neutral-800 bg-neutral-900/50 text-white">
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

            <Select
              value={orderBy}
              onValueChange={(v) => setOrderBy(v as OrderByOption)}
            >
              <SelectTrigger className="w-[160px] border-neutral-800 bg-neutral-900/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-900">
                <SelectItem
                  value="desc"
                  className="text-white hover:bg-neutral-800"
                >
                  Newest First
                </SelectItem>
                <SelectItem
                  value="asc"
                  className="text-white hover:bg-neutral-800"
                >
                  Oldest First
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <ProjectsSkeleton count={12} />
      ) : projects.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-800/50">
            <Plus className="h-12 w-12 text-neutral-600" />
          </div>
          <h3 className="font-heading mb-2 text-2xl font-bold text-white">
            {searchQuery ? "No projects found" : "No projects yet"}
          </h3>
          <p className="font-body mb-6 text-neutral-400">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Start building your first web app with Aiwa"}
          </p>
          {!searchQuery && (
            <Link href="/chat">
              <Button className="bg-white text-black hover:bg-neutral-200">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First App/Website
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
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
function generateTitle(project: Project): string {
  if (project.title) return project.title;

  if (project.messages && project.messages.length > 0) {
    const firstUserMessage = project.messages.find(
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

  return `Project ${project.id.slice(0, 8)}`;
}

function ProjectCard({ project }: { project: Project }) {
  const [imageError, setImageError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const hasPreview = project.preview_url && !imageError;
  const canShowIframe =
    project.latestVersion?.demoUrl || project.demo_url || project.demo;
  const displayTitle = generateTitle(project);

  return (
    <Link href={`/chats/${project.id}`} prefetch>
      <MagicCard
        gradientFrom="#9E7AFF"
        gradientTo="#f9a862"
        className="group rounded-lg p-1"
      >
        {/* Preview/Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-neutral-800">
          {hasPreview ? (
            <Image
              src={project.preview_url!}
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
                  project.latestVersion?.demoUrl ||
                  project.demo_url ||
                  project.demo
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
                {project.id.slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}

          {/* Visibility Badge */}
          {project.visibility && project.visibility !== "private" && (
            <div className="absolute top-2 right-2">
              <span className="font-body rounded-md border border-neutral-700 bg-black/80 px-2 py-1 text-xs font-medium text-white capitalize backdrop-blur-sm">
                {project.visibility}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-neutral-900/90 rounded-b-lg p-4">
          <h3 className="font-heading mb-1 line-clamp-2 text-base font-medium text-white transition-colors group-hover:text-neutral-200">
            {displayTitle}
          </h3>
          <p className="font-body text-xs text-neutral-500">
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString()
              : "Recently"}
          </p>
        </div>
      </MagicCard>
    </Link>
  );
}

function ProjectsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg bg-neutral-900/50 p-0.5">
          <div className="aspect-video animate-pulse rounded-t-lg bg-neutral-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
