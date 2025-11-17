"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Settings,
  Key,
  Plus,
  Loader,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Copy,
  Check
} from "lucide-react";
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

interface EnvVar {
  id?: string;
  v0_env_var_id?: string;
  key: string;
  value: string;
  showValue?: boolean;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onProjectUpdated: () => void;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onProjectUpdated
}: EditProjectDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingEnvVars, setIsLoadingEnvVars] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [icon, setIcon] = useState(project.icon || "");
  const [instructions, setInstructions] = useState(project.instructions || "");
  const [privacy, setPrivacy] = useState<"private" | "team">(
    project.privacy as "private" | "team"
  );
  const [vercelProjectId, setVercelProjectId] = useState(
    project.vercel_project_id || ""
  );
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchEnvVars();
    }
  }, [open, project.id]);

  const fetchEnvVars = async () => {
    setIsLoadingEnvVars(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/env-vars`);
      if (response.ok) {
        const data = await response.json();
        setEnvVars(
          (data.data || []).map((v: any) => ({
            ...v,
            showValue: false
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch env vars:", error);
    } finally {
      setIsLoadingEnvVars(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          icon: icon || null,
          instructions: instructions || null,
          privacy,
          vercel_project_id: vercelProjectId || null
        })
      });

      if (response.ok) {
        toast.success("Project updated");
        onProjectUpdated();
        onOpenChange(false);
      } else {
        toast.error("Failed to update project");
      }
    } catch (error) {
      toast.error("Failed to update project");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEnvVars = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/env-vars`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environmentVariables: envVars.map((v) => ({
            key: v.key,
            value: v.value,
            v0_env_var_id: v.v0_env_var_id
          }))
        })
      });

      if (response.ok) {
        toast.success("Environment variables updated");
        await fetchEnvVars();
      } else {
        toast.error("Failed to update environment variables");
      }
    } catch (error) {
      toast.error("Failed to update environment variables");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "", showValue: false }]);
  };

  const handleRemoveEnvVar = async (index: number) => {
    const envVar = envVars[index];
    if (envVar.id) {
      try {
        const response = await fetch(`/api/projects/${project.id}/env-vars`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ environmentVariableIds: [envVar.id] })
        });

        if (response.ok) {
          setEnvVars(envVars.filter((_, i) => i !== index));
          toast.success("Environment variable deleted");
        } else {
          toast.error("Failed to delete environment variable");
        }
      } catch (error) {
        toast.error("Failed to delete environment variable");
      }
    } else {
      setEnvVars(envVars.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n");
      const parsed: EnvVar[] = [...envVars];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;

        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          const cleanKey = key.trim();
          const cleanValue = value.trim().replace(/^["']|["']$/g, "");

          const existing = parsed.findIndex((v) => v.key === cleanKey);
          if (existing >= 0) {
            parsed[existing].value = cleanValue;
          } else {
            parsed.push({ key: cleanKey, value: cleanValue, showValue: false });
          }
        }
      });

      setEnvVars(parsed);
      toast.success("Environment variables loaded from file");
    } catch (error) {
      toast.error("Failed to parse file");
    }

    event.target.value = "";
  };

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass border-white/[0.12]",
          "max-h-[90vh] w-full max-w-2xl",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          "flex flex-col p-0"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="shrink-0 border-b border-white/[0.08] p-6">
            <div className="flex items-center gap-3">
              <div className="from-primary/20 rounded-lg bg-gradient-to-br to-purple-500/20 p-2">
                <Settings className="text-primary-foreground h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Edit Project
                </h2>
                <p className="text-sm text-white/60">
                  Update project settings and environment variables
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="shrink-0 border-b border-white/[0.08] px-6">
              <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0">
                <TabsTrigger
                  value="general"
                  className={cn(
                    "relative rounded-none border-b-2 border-transparent px-4 py-3",
                    "data-[state=active]:border-primary data-[state=active]:bg-transparent",
                    "data-[state=active]:text-white"
                  )}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="env-vars"
                  className={cn(
                    "relative rounded-none border-b-2 border-transparent px-4 py-3",
                    "data-[state=active]:border-primary data-[state=active]:bg-transparent",
                    "data-[state=active]:text-white"
                  )}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Environment Variables
                </TabsTrigger>
              </TabsList>
            </div>

            {/* General Tab */}
            <TabsContent value="general" className="m-0 flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(90vh-280px)]">
                <div className="space-y-4 p-6">
                  <div>
                    <Label className="text-white">
                      Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 border-white/10 bg-white/5 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1.5 min-h-[80px] border-white/10 bg-white/5 text-white"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-white">Icon (Emoji)</Label>
                      <Input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="🚀"
                        className="mt-1.5 border-white/10 bg-white/5 text-white"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Vercel Project ID</Label>
                      <Input
                        value={vercelProjectId}
                        onChange={(e) => setVercelProjectId(e.target.value)}
                        className="mt-1.5 border-white/10 bg-white/5 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Instructions</Label>
                    <Textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="# AI-Powered App Configuration&#10;&#10;Build AI features using Vercel AI SDK with Google Gemini Flash 2.0 as default."
                      className="mt-1.5 min-h-[120px] border-white/10 bg-white/5 font-mono text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Team Project
                      </p>
                      <p className="text-xs text-white/60">
                        Share with team members
                      </p>
                    </div>
                    <Switch
                      checked={privacy === "team"}
                      onCheckedChange={(checked) =>
                        setPrivacy(checked ? "team" : "private")
                      }
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Environment Variables Tab */}
            <TabsContent
              value="env-vars"
              className="m-0 flex-1 overflow-hidden"
            >
              <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-3">
                  <p className="text-xs text-white/60">
                    {envVars.length} variable{envVars.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        document.getElementById("edit-env-file-upload")?.click()
                      }
                      className="h-8 text-xs"
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Upload .env</span>
                      <span className="sm:hidden">.env</span>
                    </Button>
                    <input
                      id="edit-env-file-upload"
                      type="file"
                      accept=".env,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddEnvVar}
                      className="h-8 bg-white/10 text-xs hover:bg-white/20"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Add Variable</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {isLoadingEnvVars ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-white/40" />
                    </div>
                  ) : envVars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                      <Key className="mb-4 h-12 w-12 text-white/20" />
                      <p className="text-sm text-white/60">
                        No environment variables yet
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        Add variables to configure your project
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {envVars.map((envVar, index) => (
                        <div
                          key={index}
                          className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={envVar.key}
                                onChange={(e) => {
                                  const newVars = [...envVars];
                                  newVars[index].key = e.target.value;
                                  setEnvVars(newVars);
                                }}
                                placeholder="VARIABLE_NAME"
                                className="border-white/10 bg-white/5 text-white uppercase"
                              />
                              <div className="relative">
                                <Input
                                  type={envVar.showValue ? "text" : "password"}
                                  value={envVar.value}
                                  onChange={(e) => {
                                    const newVars = [...envVars];
                                    newVars[index].value = e.target.value;
                                    setEnvVars(newVars);
                                  }}
                                  placeholder="Enter value"
                                  className="border-white/10 bg-white/5 pr-20 text-white"
                                />
                                <div className="absolute top-1/2 right-1 flex -translate-y-1/2 gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newVars = [...envVars];
                                      newVars[index].showValue =
                                        !newVars[index].showValue;
                                      setEnvVars(newVars);
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    {envVar.showValue ? (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleCopy(envVar.value, envVar.key)
                                    }
                                    disabled={!envVar.value}
                                    className="h-7 w-7 p-0"
                                  >
                                    {copiedKey === envVar.key ? (
                                      <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveEnvVar(index)}
                              className="mt-7 h-8 w-8 shrink-0 p-0 text-white/40 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="shrink-0 border-t border-white/[0.08] p-4 sm:p-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
                className="text-foreground w-full sm:w-auto"
              >
                Cancel
              </Button>
              {activeTab === "general" ? (
                <Button
                  onClick={handleUpdateProject}
                  disabled={!name.trim() || isUpdating}
                  className="text-background w-full bg-neutral-100 hover:bg-neutral-200 sm:w-auto"
                >
                  {isUpdating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleUpdateEnvVars}
                  disabled={isUpdating}
                  className="text-background w-full bg-neutral-100 hover:bg-neutral-200 sm:w-auto"
                >
                  {isUpdating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Environment Variables"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
