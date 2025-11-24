"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader, Video } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PostVideoDialog({
  open,
  onOpenChange,
  onSuccess
}: PostVideoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      toast.error("YouTube URL is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/hub/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          category: category.trim() || null,
          summary: summary.trim() || null,
          isFeatured
        })
      });

      if (response.ok) {
        toast.success("Video posted successfully!");
        onSuccess();
        onOpenChange(false);
        // Reset form
        setYoutubeUrl("");
        setTags("");
        setCategory("");
        setSummary("");
        setIsFeatured(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to post video");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass border-white/[0.12]",
          "max-w-2xl",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        )}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
            <div className="rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/20 p-2">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Post Video to Hub
              </h2>
              <p className="text-sm text-white/60">
                Add a new video to the Vibe Hub
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url" className="text-white">
                YouTube URL <span className="text-red-400">*</span>
              </Label>
              <Input
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                disabled={isLoading}
              />
              <p className="text-xs text-white/40">
                Video metadata will be fetched automatically
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary" className="text-white">
                Summary
              </Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of the video content..."
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">
                  Category
                </Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Tutorial, Comparison, etc."
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-white">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="nextjs, typescript, tutorial"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  disabled={isLoading}
                />
                <p className="text-xs text-white/40">Comma-separated tags</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="featured" className="text-white">
                  Featured Video
                </Label>
                <p className="text-xs text-white/40">
                  Highlight this video in the featured section
                </p>
              </div>
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
                disabled={isLoading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-white/[0.08] pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 gap-2 bg-white text-black hover:bg-white/90"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Post Video
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
