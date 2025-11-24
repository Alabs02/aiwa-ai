"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Sparkles, Loader, Video } from "lucide-react";
import { toast } from "sonner";
import { GL } from "@/components/gl";
import { Leva } from "leva";
import { VideoCard } from "./video-card";
import { PostVideoDialog } from "./post-video-dialog";
import type { HubVideo } from "@/lib/db/schema";

export function VibeHubClient() {
  const [videos, setVideos] = useState<HubVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [hovering, setHovering] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchUserRole();
    fetchVideos();
    fetchCategories();
  }, [activeTab]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user/role");
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
  };

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "featured") {
        params.append("featured", "true");
      } else if (activeTab !== "all" && categories.includes(activeTab)) {
        params.append("category", activeTab);
      }
      if (searchQuery) {
        params.append("q", searchQuery);
      }

      const response = await fetch(`/api/hub/videos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/hub/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSearch = () => {
    fetchVideos();
  };

  const handleVideoPosted = () => {
    fetchVideos();
    toast.success("Video posted successfully!");
  };

  const isAdmin = userRole === "admin";

  return (
    <div className="grid min-h-screen grid-cols-1 bg-black/95 p-6 md:p-8">
      <GL hovering={hovering} />
      <Leva hidden />

      <div className="bg-background/40 relative z-10 w-full">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-gradient-premium text-4xl !leading-snug font-semibold tracking-tight">
                  Vibe Hub
                </h1>
                <p className="text-sm text-neutral-400">
                  Explore vibe-coding tutorials, community builds, platform
                  walkthroughs, comparisons, and creator stories—everything you
                  need to bring your ideas to life with AIWA.
                </p>
              </div>

              {isAdmin && (
                <Button
                  onClick={() => setIsPostDialogOpen(true)}
                  className="gap-2 bg-white text-black hover:bg-white/90"
                >
                  <Plus className="h-4 w-4" />
                  Post Video
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search videos, tutorials, comparisons..."
                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-white/[0.08]">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white/10"
                >
                  All Videos
                </TabsTrigger>
                <TabsTrigger
                  value="featured"
                  className="data-[state=active]:bg-white/10"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Featured
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="data-[state=active]:bg-white/10"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-white/40" />
                </div>
              ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <Video className="mb-3 h-12 w-12 text-white/20" />
                  <p className="mb-1 text-sm text-white/60">No videos yet</p>
                  <p className="text-xs text-white/40">
                    {isAdmin && "Post your first video to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onHover={setHovering}
                      isAdmin={isAdmin}
                      onUpdate={fetchVideos}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Post Video Dialog */}
      {isAdmin && (
        <PostVideoDialog
          open={isPostDialogOpen}
          onOpenChange={setIsPostDialogOpen}
          onSuccess={handleVideoPosted}
        />
      )}
    </div>
  );
}
