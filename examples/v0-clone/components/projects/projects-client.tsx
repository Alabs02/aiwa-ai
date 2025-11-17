"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";
import { Plus, Search, Loader, FolderOpen } from "lucide-react";
import { toast } from "sonner";

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

export function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      } else {
        toast.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setProjects(projects.filter((p) => p.id !== projectId));
        toast.success("Project deleted");
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.08] bg-black/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Projects</h1>
            <p className="mt-1 text-sm text-white/60">
              Manage your AI projects and environment variables
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="text-background bg-neutral-100 hover:bg-neutral-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-white/40" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="rounded-full bg-white/5 p-6">
              <FolderOpen className="h-12 w-12 text-white/20" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">
              {searchQuery ? "No projects found" : "No projects yet"}
            </h3>
            <p className="mt-2 text-sm text-white/60">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first project to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 bg-white/10 hover:bg-white/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => handleEdit(project)}
                onDelete={() => handleDelete(project.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProjectCreated={fetchProjects}
      />

      {editingProject && (
        <EditProjectDialog
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          project={editingProject}
          onProjectUpdated={fetchProjects}
        />
      )}
    </div>
  );
}
