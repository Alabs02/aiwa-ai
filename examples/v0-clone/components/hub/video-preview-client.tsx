"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Calendar, Tag, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GL } from "@/components/gl";
import { Leva } from "leva";
import type { HubVideo } from "@/lib/db/schema";
import { formatDuration, getYouTubeEmbedUrl } from "@/lib/youtube";

interface VideoPreviewClientProps {
  video: HubVideo;
  userId?: string;
}

export function VideoPreviewClient({ video, userId }: VideoPreviewClientProps) {
  const [hovering, setHovering] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");
  const router = useRouter();

  useState(() => {
    if (userId) {
      fetch("/api/user/role").then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        }
      });
    }
  });

  const isAdmin = userRole === "admin";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      const response = await fetch(`/api/hub/videos/${video.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Video deleted");
        router.push("/hub");
      } else {
        toast.error("Failed to delete video");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-black/95 p-6 md:p-8">
      <GL hovering={hovering} />
      <Leva hidden />

      <div className="bg-background/40 relative z-10 w-full">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/hub")}
            className="text-white/60 hover:text-white"
          >
            ← Back to Hub
          </Button>

          {/* Video Player */}
          <div
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="glass rounded-2xl p-6"
          >
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                src={getYouTubeEmbedUrl(video.youtube_id)}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>

            {/* Video Info */}
            <div className="mt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <h1 className="text-gradient-premium text-2xl !leading-snug font-semibold">
                    {video.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                    {video.view_count !== null && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {video.view_count} views
                      </div>
                    )}
                    {video.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {video.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(video.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDelete}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tags & Category */}
              <div className="flex flex-wrap gap-2">
                {video.category && (
                  <Badge className="rounded-full border-0 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">
                    {video.category}
                  </Badge>
                )}
                {video.tags?.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="rounded-full border-0 bg-white/5 text-white/70 hover:bg-white/10"
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Summary */}
              {video.summary && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">Summary</h3>
                  <p className="text-sm text-white/70">{video.summary}</p>
                </div>
              )}

              {/* Description */}
              {video.description && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">Description</h3>
                  <p className="text-sm whitespace-pre-line text-white/70">
                    {video.description}
                  </p>
                </div>
              )}

              {/* Transcript */}
              {video.transcript && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">Transcript</h3>
                  <p className="text-sm whitespace-pre-line text-white/70">
                    {video.transcript}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
