"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  ImageIcon
} from "lucide-react";

interface PostBlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PostBlogDialog({
  open,
  onOpenChange,
  onSuccess
}: PostBlogDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
    content: "<p>Start writing your blog post...</p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3"
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !editor?.getHTML()) {
      toast.error("Title and content required");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          content: editor.getHTML(),
          coverImage: coverImage.trim() || null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          category: category.trim() || null,
          isPublished,
          isFeatured
        })
      });

      if (res.ok) {
        toast.success("Post created!");
        onSuccess();
        onOpenChange(false);
        // Reset form
        setTitle("");
        setExcerpt("");
        setCoverImage("");
        setTags("");
        setCategory("");
        setIsPublished(false);
        setIsFeatured(false);
        editor?.commands.setContent("<p>Start writing your blog post...</p>");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create post");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!editor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass max-h-[90vh] max-w-4xl overflow-y-auto border-white/[0.12]"
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
            <div className="rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/20 p-2">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                New Blog Post
              </h2>
              <p className="text-sm text-white/60">Create a new blog post</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title..."
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt" className="text-white">
                Excerpt
              </Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description..."
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">
                Content <span className="text-red-400">*</span>
              </Label>
              <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <div className="flex flex-wrap gap-1 border-b border-white/10 bg-white/[0.03] p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("bold") && "bg-white/10"
                    )}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("italic") && "bg-white/10"
                    )}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("strike") && "bg-white/10"
                    )}
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("code") && "bg-white/10"
                    )}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 w-px bg-white/10" />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("heading", { level: 1 }) && "bg-white/10"
                    )}
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("heading", { level: 2 }) && "bg-white/10"
                    )}
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 w-px bg-white/10" />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("bulletList") && "bg-white/10"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("orderedList") && "bg-white/10"
                    )}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editor.chain().focus().toggleBlockquote().run()
                    }
                    className={cn(
                      "h-8 w-8 p-0",
                      editor.isActive("blockquote") && "bg-white/10"
                    )}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 w-px bg-white/10" />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().undo().run()}
                    className="h-8 w-8 p-0"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().redo().run()}
                    className="h-8 w-8 p-0"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cover" className="text-white">
                  Cover Image URL
                </Label>
                <Input
                  id="cover"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">
                  Category
                </Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Tutorial, Guide, etc."
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  disabled={isLoading}
                />
              </div>
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
              <p className="text-xs text-white/40">Comma-separated</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                <div>
                  <Label htmlFor="published" className="text-white">
                    Publish Post
                  </Label>
                  <p className="text-xs text-white/40">
                    Make post visible to everyone
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                <div>
                  <Label htmlFor="featured" className="text-white">
                    Featured Post
                  </Label>
                  <p className="text-xs text-white/40">
                    Show in featured section
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                  disabled={isLoading}
                />
              </div>
            </div>

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
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Post
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
