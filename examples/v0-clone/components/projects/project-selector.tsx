"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/components/home/home-client.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader } from "lucide-react";
import { IconFolder } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
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
}

export function ProjectSelector() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    selectedProjectId,
    projects,
    setSelectedProjectId,
    setProjects,
    setEnvVarsValid,
    setShowEnvDialog
  } = useChatStore();

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

        if (data.data && data.data.length > 0) {
          const firstProject = data.data[0];
          setSelectedProjectId(firstProject.id);
          await checkEnvVars(firstProject.id);
        }
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

  const checkEnvVars = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/env-vars`);
      if (response.ok) {
        const data = await response.json();
        const envVars = data.data || [];

        const hasV0ApiKey = envVars.some((v: any) => v.key === "V0_API_KEY");
        const hasGatewayKey = envVars.some(
          (v: any) => v.key === "AI_GATEWAY_API_KEY"
        );

        const isValid = hasV0ApiKey && hasGatewayKey;
        setEnvVarsValid(isValid);

        if (!isValid) {
          setTimeout(() => setShowEnvDialog(true), 500);
        }
      }
    } catch (error) {
      console.error("Failed to check env vars:", error);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    await checkEnvVars(projectId);
  };

  const truncateName = (name: string) => {
    if (name.length <= 5) return name;
    return `${name.slice(0, 5)}...`;
  };

  const getProjectIcon = (project: Project) => {
    if (project.icon) return project.icon;
    return <IconFolder className="h-3.5 w-3.5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
        <Loader className="h-3.5 w-3.5 animate-spin text-white/40" />
        <span className="text-xs text-white/60">Loading...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  return (
    <Select
      value={selectedProjectId || undefined}
      onValueChange={handleProjectChange}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-auto gap-2 rounded-full border-white/10 bg-white/5",
          "transition-colors hover:bg-white/10",
          "data-[state=open]:bg-white/10"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="text-white/60">
            {selectedProject && getProjectIcon(selectedProject)}
          </div>
          <SelectValue>
            <span className="text-xs text-white">
              {selectedProject && truncateName(selectedProject.name)}
            </span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="glass border-white/[0.12]">
        {projects.map((project: any) => (
          <SelectItem
            key={project.id}
            value={project.id}
            className="cursor-pointer hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <div className="text-white/60">{getProjectIcon(project)}</div>
              <span className="text-sm text-white">{project.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
