"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  Key,
  MessageSquare
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  v0_project_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  instructions?: string | null;
  privacy: string;
  vercel_project_id?: string | null;
  created_at: string;
  updated_at: string;
  env_vars?: any[];
  chat_count?: number;
}

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg",
          "border border-white/10 bg-white/5",
          "hover:border-white/20 hover:bg-white/10",
          "transition-all duration-200"
        )}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="from-primary/20 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br to-purple-500/20 text-xl">
                {project.icon || (
                  <Folder className="text-primary-foreground h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-white">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/60">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/40 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass border-white/[0.12]"
              >
                <DropdownMenuItem
                  onClick={onEdit}
                  className="cursor-pointer hover:bg-white/10"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer text-red-400 hover:bg-white/10 hover:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
            {project.env_vars !== undefined && (
              <div className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                <span>{project.env_vars.length} env vars</span>
              </div>
            )}
            {project.chat_count !== undefined && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{project.chat_count} chats</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">
              {project.privacy === "team" ? "Team" : "Private"}
            </span>
            <span className="text-xs text-white/40">
              {formatDate(project.created_at)}
            </span>
          </div>
        </div>

        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/0 to-purple-500/0 opacity-0 transition-opacity duration-200 group-hover:opacity-10" />
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass border-white/[0.12]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete "{project.name}"? This action
              cannot be undone and will remove all associated environment
              variables.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
