"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Trash2, Edit, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDuration } from "@/lib/youtube";
import type { HubVideo } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: HubVideo;
  onHover: (hovering: boolean) => void;
  isAdmin: boolean;
  onUpdate: () => void;
}

export function VideoCard({
  video,
  onHover,
  isAdmin,
  onUpdate
}: VideoCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this video?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/hub/videos/${video.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Video deleted");
        onUpdate();
      } else {
        toast.error("Failed to delete video");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    router.push(`/hub/${video.id}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl transition-all duration-300",
        "hover:border-white/10 hover:bg-white/[0.05]"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5">
            <Eye className="h-12 w-12 text-white/20" />
          </div>
        )}

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-1 text-xs text-white backdrop-blur-sm">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Featured Badge */}
        {video.is_featured === "true" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-white">
          {video.title}
        </h3>

        {video.summary && (
          <p className="mb-3 line-clamp-2 text-xs text-white/60">
            {video.summary}
          </p>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/40">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.view_count || 0}
            </div>
            {video.published_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(video.published_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Category Badge */}
        {video.category && (
          <div className="mt-2">
            <Badge className="rounded-full border-0 bg-white/5 text-xs text-neutral-300 hover:bg-white/10">
              {video.category}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
