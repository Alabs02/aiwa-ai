"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Upload,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/components/home/home-client.store";

interface EnvVar {
  id?: string;
  v0_env_var_id?: string;
  key: string;
  value: string;
  showValue?: boolean;
}

const REQUIRED_VARS = [
  "V0_API_KEY",
  "AI_GATEWAY_API_KEY",
  "NEXT_PUBLIC_PROJECT_ID"
];
const PROTECTED_VARS = ["NEXT_PUBLIC_PROJECT_ID"];

export function EnvVariablesDialog() {
  const {
    selectedProjectId,
    showEnvDialog,
    setShowEnvDialog,
    setEnvVarsValid
  } = useChatStore();
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: "V0_API_KEY", value: "", showValue: false },
    { key: "AI_GATEWAY_API_KEY", value: "", showValue: false }
  ]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (showEnvDialog && selectedProjectId) {
      fetchEnvVars();
    }
  }, [showEnvDialog, selectedProjectId]);

  const fetchEnvVars = async () => {
    if (!selectedProjectId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${selectedProjectId}/env-vars`
      );
      if (response.ok) {
        const data = await response.json();
        const existing = data.data || [];

        if (existing.length > 0) {
          setEnvVars(
            existing.map((v: any) => ({
              ...v,
              showValue: false
            }))
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch env vars:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const hasV0Key = envVars.some((v) => v.key === "V0_API_KEY" && v.value);
    const hasGatewayKey = envVars.some(
      (v) => v.key === "AI_GATEWAY_API_KEY" && v.value
    );

    if (!hasV0Key || !hasGatewayKey) {
      toast.error("V0_API_KEY and AI_GATEWAY_API_KEY are required");
      return;
    }

    setIsSaving(true);
    try {
      // Filter out protected vars - backend will handle them
      const varsToSave = envVars.filter((v) => !PROTECTED_VARS.includes(v.key));

      const response = await fetch(
        `/api/projects/${selectedProjectId}/env-vars`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            environmentVariables: varsToSave.map((v) => ({
              key: v.key,
              value: v.value
            })),
            upsert: true
          })
        }
      );

      if (response.ok) {
        setEnvVarsValid(true);
        setShowEnvDialog(false);
        toast.success("Environment variables saved");
      } else {
        toast.error("Failed to save environment variables");
      }
    } catch (error) {
      toast.error("Failed to save environment variables");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVar = () => {
    setEnvVars([...envVars, { key: "", value: "", showValue: false }]);
  };

  const handleRemoveVar = (index: number) => {
    const envVar = envVars[index];
    if (REQUIRED_VARS.includes(envVar.key)) {
      toast.error("Cannot remove required environment variables");
      return;
    }
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleKeyChange = (index: number, key: string) => {
    const envVar = envVars[index];
    if (PROTECTED_VARS.includes(envVar.key)) {
      toast.error(`${envVar.key} is managed automatically by AIWA`);
      return;
    }
    const newVars = [...envVars];
    newVars[index].key = key;
    setEnvVars(newVars);
  };

  const handleValueChange = (index: number, value: string) => {
    const envVar = envVars[index];
    if (PROTECTED_VARS.includes(envVar.key)) {
      toast.error(
        `${envVar.key} cannot be modified - it's managed automatically`
      );
      return;
    }
    const newVars = [...envVars];
    newVars[index].value = value;
    setEnvVars(newVars);
  };

  const toggleShowValue = (index: number) => {
    const newVars = [...envVars];
    newVars[index].showValue = !newVars[index].showValue;
    setEnvVars(newVars);
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

          // Skip protected vars
          if (PROTECTED_VARS.includes(cleanKey)) return;

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

  const hasRequiredVars = REQUIRED_VARS.every((key) =>
    envVars.some((v) => v.key === key && v.value)
  );

  const isProtected = (key: string) => PROTECTED_VARS.includes(key);

  return (
    <Dialog open={showEnvDialog} onOpenChange={() => {}}>
      <DialogContent
        className={cn(
          "glass border-white/[0.12]",
          "flex h-[85vh] max-h-[85vh] w-full max-w-2xl flex-col",
          "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          "p-0"
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* <div className="flex h-full flex-col"> */}
        <div className="shrink-0 border-b border-white/[0.08] p-6">
          <div className="flex items-center gap-3">
            <div className="from-primary/20 rounded-lg bg-gradient-to-br to-purple-500/20 p-2">
              <Key className="text-primary-foreground h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Environment Variables
              </h2>
              <p className="text-sm text-white/60">
                Configure required environment variables for your project
              </p>
            </div>
          </div>

          {!hasRequiredVars && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">
                  Required variables missing
                </p>
                <p className="mt-1 text-xs text-red-400/80">
                  V0_API_KEY and AI_GATEWAY_API_KEY must be set before you can
                  continue
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-3">
          <p className="text-xs text-white/60">
            {envVars.length} variable{envVars.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                document.getElementById("env-file-upload")?.click()
              }
              className="h-8 text-xs"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload .env
            </Button>
            <input
              id="env-file-upload"
              type="file"
              accept=".env,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              size="sm"
              onClick={handleAddVar}
              className="h-8 bg-white/10 text-xs hover:bg-white/20"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Variable
            </Button>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-white/40" />
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {envVars.map((envVar, index) => {
                const isRequired = REQUIRED_VARS.includes(envVar.key);
                const isLocked = isProtected(envVar.key);

                return (
                  <div
                    key={index}
                    className={cn(
                      "space-y-3 rounded-lg border p-4",
                      isLocked
                        ? "border-blue-500/20 bg-blue-500/5"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        {/* Key Section */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Label className="text-xs text-white/60">
                              Key{" "}
                              {isRequired && (
                                <span className="text-red-400">*</span>
                              )}
                            </Label>
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">
                                <Lock className="h-2.5 w-2.5" />
                                Auto-managed
                              </span>
                            )}
                          </div>
                          <Input
                            value={envVar.key}
                            onChange={(e) =>
                              handleKeyChange(index, e.target.value)
                            }
                            placeholder="VARIABLE_NAME"
                            disabled={isRequired || isLocked}
                            className={cn(
                              "border-white/10 font-mono text-sm text-white",
                              isLocked
                                ? "cursor-not-allowed bg-blue-500/10"
                                : "bg-white/5",
                              isRequired &&
                                !isLocked &&
                                "cursor-not-allowed opacity-60"
                            )}
                          />
                          {isLocked && (
                            <p className="text-[11px] leading-tight text-blue-400/80">
                              Set to your project ID for AIWA Cloud
                            </p>
                          )}
                        </div>

                        {/* Value Section */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-white/60">
                            Value{" "}
                            {isRequired && (
                              <span className="text-red-400">*</span>
                            )}
                          </Label>
                          <div className="relative">
                            <Input
                              type={envVar.showValue ? "text" : "password"}
                              value={envVar.value}
                              onChange={(e) =>
                                handleValueChange(index, e.target.value)
                              }
                              placeholder={
                                isLocked ? "Auto-generated" : "Enter value"
                              }
                              disabled={isLocked}
                              className={cn(
                                "border-white/10 pr-20 font-mono text-sm text-white",
                                isLocked
                                  ? "cursor-not-allowed bg-blue-500/10"
                                  : "bg-white/5"
                              )}
                            />
                            <div className="absolute top-1/2 right-1 flex -translate-y-1/2 gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleShowValue(index)}
                                disabled={isLocked}
                                className="h-7 w-7 p-0 hover:bg-white/10"
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
                                className="h-7 w-7 p-0 hover:bg-white/10"
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
                      </div>

                      {/* Delete Button */}
                      {!isRequired && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveVar(index)}
                          className="mt-8 h-8 w-8 shrink-0 p-0 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="shrink-0 border-t border-white/[0.08] p-6">
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasRequiredVars || isSaving}
              className={cn(
                "text-background bg-neutral-100 hover:bg-neutral-200",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {isSaving ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </div>
        </div>
        {/* </div> */}
      </DialogContent>
    </Dialog>
  );
}
