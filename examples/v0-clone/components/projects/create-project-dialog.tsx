"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Plus,
  Loader,
  FolderPlus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated
}: CreateProjectDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [instructions, setInstructions] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "team">("private");
  const [vercelProjectId, setVercelProjectId] = useState("");
  const [envVars, setEnvVars] = useState<
    Array<{ key: string; value: string; showValue?: boolean }>
  >([]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(description && { description }),
          ...(icon && { icon }),
          ...(instructions && { instructions }),
          privacy,
          ...(vercelProjectId && { vercelProjectId }),
          ...(envVars.length > 0 && {
            environmentVariables: envVars.map((v) => ({
              key: v.key,
              value: v.value
            }))
          })
        })
      });

      if (response.ok) {
        toast.success("Project created");
        onProjectCreated();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error("Failed to create project");
      }
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("");
    setInstructions("");
    setPrivacy("private");
    setVercelProjectId("");
    setEnvVars([]);
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "", showValue: false }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass border-white/[0.12]",
          "max-h-[85vh] max-w-2xl",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          "p-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/[0.08] p-6">
            <div className="flex items-center gap-3">
              <div className="from-primary/20 rounded-lg bg-gradient-to-br to-purple-500/20 p-2">
                <FolderPlus className="text-primary-foreground h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Create Project
                </h2>
                <p className="text-sm text-white/60">
                  Set up a new project with custom configuration
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-white">
                    Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Project"
                    className="mt-1.5 border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your project"
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
                      placeholder="prj_..."
                      className="mt-1.5 border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Instructions</Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Custom instructions for the AI model"
                    className="mt-1.5 min-h-[100px] border-white/10 bg-white/5 text-white"
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Environment Variables</Label>
                  <Button
                    size="sm"
                    onClick={handleAddEnvVar}
                    className="h-8 bg-white/10 text-xs hover:bg-white/20"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Variable
                  </Button>
                </div>

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
                          placeholder="KEY"
                          className="border-white/10 bg-white/5 text-white"
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
                            placeholder="Value"
                            className="border-white/10 bg-white/5 pr-10 text-white"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newVars = [...envVars];
                              newVars[index].showValue =
                                !newVars[index].showValue;
                              setEnvVars(newVars);
                            }}
                            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
                          >
                            {envVar.showValue ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveEnvVar(index)}
                        className="mt-6 h-8 w-8 p-0 text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <div className="border-t border-white/[0.08] p-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                className="text-background bg-neutral-100 hover:bg-neutral-200"
              >
                {isCreating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
