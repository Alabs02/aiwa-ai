"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Calendar, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GL } from "@/components/gl";
import { Leva } from "leva";
import type { BlogPost } from "@/lib/db/schema";

interface BlogPostClientProps {
  post: BlogPost;
  userId?: string;
}

export function BlogPostClient({ post, userId }: BlogPostClientProps) {
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
    if (!confirm("Delete this post?")) return;

    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Post deleted");
        router.push("/blog");
      } else {
        toast.error("Failed to delete");
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
        <div className="mx-auto max-w-4xl space-y-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/blog")}
            className="text-white/60 hover:text-white"
          >
            ← Back to Blog
          </Button>

          <article
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="glass rounded-2xl p-8"
          >
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="mb-6 w-full rounded-xl"
              />
            )}

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-gradient-premium mb-4 text-3xl !leading-snug font-bold">
                    {post.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                    {post.view_count !== null && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.view_count} views
                      </div>
                    )}
                    {post.reading_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.reading_time} min read
                      </div>
                    )}
                    {post.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {post.category && (
                  <Badge className="rounded-full border-0 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">
                    {post.category}
                  </Badge>
                )}
                {post.tags?.map((tag, i) => (
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

              {post.excerpt && (
                <p className="border-l-2 border-white/20 pl-4 text-lg text-white/80 italic">
                  {post.excerpt}
                </p>
              )}

              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
