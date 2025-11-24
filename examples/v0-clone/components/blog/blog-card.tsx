"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Trash2, Calendar, Star } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
  onHover: (hovering: boolean) => void;
  isAdmin: boolean;
  onUpdate: () => void;
}

export function BlogCard({ post, onHover, isAdmin, onUpdate }: BlogCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this post?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Post deleted");
        onUpdate();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => router.push(`/blog/${post.slug}`)}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]",
        "backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05]"
      )}
    >
      {post.cover_image && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {post.is_featured === "true" && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                Featured
              </span>
            </div>
          )}
          {post.is_published === "false" && (
            <div className="absolute top-2 right-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 backdrop-blur-sm">
              <span className="text-xs font-medium text-orange-400">Draft</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-white">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mb-3 line-clamp-2 text-xs text-white/60">
            {post.excerpt}
          </p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/40">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count || 0}
            </div>
            {post.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time} min
              </div>
            )}
            {post.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.published_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {post.category && (
          <div className="mt-2">
            <Badge className="rounded-full border-0 bg-white/5 text-xs text-neutral-300 hover:bg-white/10">
              {post.category}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
