"use client";
import { useState, useEffect } from "react";
import { UpgradePromptDialog } from "@/components/shared/upgrade-prompt-dialog";
import { getFeatureAccess } from "@/lib/feature-access";

import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewConsole
} from "@/components/ai-elements/web-preview";
import {
  PreviewLoadingAnimation,
  CodeGenerationAnimation
} from "@/components/ai-elements/preview-loading-animations";
import { CodeViewer } from "@/components/ai-elements/code-viewer";
import { StreamingCodePreview } from "@/components/ai-elements/streaming-code-preview";
import { GitHubExportDialog } from "@/components/chat/github-export-dialog";
import { RefreshCw, Maximize, Minimize, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/components/home/home-client.store";

// Support both v0 API format and legacy format
interface V0ApiFile {
  object: "file";
  name: string;
  content: string;
  locked: boolean;
}

interface LegacyFileItem {
  lang: string;
  meta: {
    fileName: string;
  };
  source: string;
}

type FileItem = V0ApiFile | LegacyFileItem;

interface Chat {
  id: string;
  demo?: string;
  url?: string;
  title?: string;
  files?: FileItem[];
  latestVersion?: {
    demoUrl?: string;
    files?: V0ApiFile[];
  };
}

interface PreviewPanelProps {
  currentChat: Chat | null;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  refreshKey: number;
  setRefreshKey: (key: number | ((prev: number) => number)) => void;
  isGenerating?: boolean;
  consoleLogs?: Array<{
    level: "log" | "warn" | "error";
    message: string;
    timestamp: Date;
  }>;
}

// Get language from file path for v0 API files
const getLanguageFromPath = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const extMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    py: "python",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown"
  };
  return extMap[ext] || "plaintext";
};

// Transform FileItem to format expected by CodeGenerationAnimation
const transformFilesForAnimation = (
  files: FileItem[]
): Array<{ name: string; content: string }> => {
  return files.map((file) => {
    // Handle v0 API format
    if ("object" in file && file.object === "file") {
      const v0File = file as V0ApiFile;
      return {
        name: v0File.name,
        content: v0File.content
      };
    }

    // Handle legacy format
    const legacyFile = file as LegacyFileItem;
    return {
      name: legacyFile.meta.fileName,
      content: legacyFile.source
    };
  });
};

export function PreviewPanel({
  currentChat,
  isFullscreen,
  setIsFullscreen,
  refreshKey,
  setRefreshKey,
  isGenerating = false,
  consoleLogs = []
}: PreviewPanelProps) {
  const [userPlan, setUserPlan] = useState<string>("free");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  // Get demo URL from either location
  const demoUrl = currentChat?.demo || currentChat?.latestVersion?.demoUrl;
  const hasContent = !!demoUrl;

  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
  const { getSelectedProject } = useChatStore();

  // Get files - prioritize latestVersion (v0 API format) over root files (legacy)
  const allFiles: FileItem[] =
    currentChat?.latestVersion?.files || currentChat?.files || [];

  // Filter code files - check both v0 API and legacy formats
  const codeFiles = allFiles.filter((file) => {
    // Handle v0 API format
    if ("object" in file && file.object === "file") {
      const v0File = file as V0ApiFile;
      const ext = v0File.name.split(".").pop()?.toLowerCase() || "";
      return v0File.name && !ext.match(/^(png|jpg|jpeg|gif|svg|webp|ico)$/i);
    }

    // Handle legacy format
    const legacyFile = file as LegacyFileItem;
    return (
      legacyFile.meta?.fileName &&
      !legacyFile.lang.match(/^(png|jpg|jpeg|gif|svg|webp|ico)$/i)
    );
  });

  console.log({
    currentChat,
    allFilesLength: allFiles.length,
    codeFilesLength: codeFiles.length,
    hasV0Files: !!currentChat?.latestVersion?.files,
    v0FilesCount: currentChat?.latestVersion?.files?.length || 0,
    hasLegacyFiles: !!currentChat?.files,
    legacyFilesCount: currentChat?.files?.length || 0,
    sampleFile: allFiles[0],
    sampleCodeFile: codeFiles[0]
  });

  const handleDownload = async () => {
    console.log({ userPlan });
    const access = getFeatureAccess(userPlan as any);

    console.log({ access });

    if (!currentChat?.id) return;

    if (!access.canDownload) {
      setBlockedFeature("Download");
      setShowUpgradeDialog(true);
      return;
    }

    try {
      const selectedProject = getSelectedProject();

      const params = new URLSearchParams({
        chatId: currentChat.id,
        format: "zip",
        includeDefaultFiles: "true",
        ...(selectedProject?.id && { projectId: selectedProject.id })
      });

      const response = await fetch(`/api/chat/download?${params}`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `app-${currentChat?.title || currentChat?.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleOpenExternal = () => {
    if (!demoUrl) return;
    window.open(demoUrl, "_blank", "noopener,noreferrer");
  };

  const handleGitHubExport = () => {
    const access = getFeatureAccess(userPlan as any);

    if (!access.canUseGitHub) {
      setBlockedFeature("GitHub Export");
      setShowUpgradeDialog(true);
      return;
    }

    setGithubDialogOpen(true);
  };

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((data) => setUserPlan(data?.plan || "free"))
      .catch(() => setUserPlan("free"));
  }, []);

  const getEmptyState = () => (
    <div className="flex h-full flex-1 items-center justify-center bg-gray-50 dark:bg-black">
      <div className="max-w-md px-8 text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-transparent blur-3xl" />
          <div className="relative rounded-2xl bg-transparent p-8 shadow-lg">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <p className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          No preview available
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start a conversation to see your app come to life here
        </p>
      </div>
    </div>
  );

  /**
   * Determine code content based on generation state
   * - During generation: Show StreamingCodePreview with current files
   * - After generation: Show full CodeViewer
   * - No files: Show empty state
   */
  const getCodeContent = () => {
    // During generation - show streaming preview
    if (isGenerating && codeFiles.length > 0) {
      return <StreamingCodePreview files={codeFiles} />;
    }

    // After generation - show full code viewer
    if (!isGenerating && codeFiles.length > 0) {
      return (
        <CodeViewer
          files={codeFiles}
          chatId={currentChat?.id}
          chatTitle={currentChat?.title}
        />
      );
    }

    // During generation but no files yet - show code generation animation
    if (isGenerating) {
      const animationFiles =
        codeFiles.length > 0
          ? transformFilesForAnimation(codeFiles)
          : undefined;

      return <CodeGenerationAnimation files={animationFiles} />;
    }

    // No files available
    return (
      <div className="flex h-full items-center justify-center text-white/40">
        <div className="text-center">
          <p className="text-sm">No code files available</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "flex h-full flex-col transition-all duration-300",
          isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-black" : "flex-1"
        )}
      >
        <WebPreview
          defaultUrl={demoUrl || ""}
          onUrlChange={(url) => {
            console.log("Preview URL changed:", url);
          }}
          onDownload={handleDownload}
          onOpenExternal={handleOpenExternal}
        >
          <WebPreviewNavigation
            onDownload={handleDownload}
            onOpenExternal={handleOpenExternal}
            hasContent={hasContent}
          >
            <WebPreviewNavigationButton
              onClick={() => {
                setRefreshKey((prev) => prev + 1);
              }}
              tooltip="Refresh preview"
              disabled={!hasContent}
            >
              <RefreshCw className="h-4 w-4" />
            </WebPreviewNavigationButton>

            <WebPreviewUrl
              readOnly
              placeholder="Your app will appear here..."
              value={demoUrl || ""}
            />

            <WebPreviewNavigationButton
              onClick={handleGitHubExport}
              tooltip="Export to GitHub"
              disabled={!hasContent}
            >
              <Github className="h-4 w-4" />
            </WebPreviewNavigationButton>

            <WebPreviewNavigationButton
              onClick={() => setIsFullscreen(!isFullscreen)}
              tooltip={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              disabled={!hasContent && !isGenerating}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </WebPreviewNavigationButton>
          </WebPreviewNavigation>

          <WebPreviewBody
            key={refreshKey}
            iframeSrc={demoUrl}
            loading={isGenerating ? <PreviewLoadingAnimation /> : undefined}
            codeContent={getCodeContent()}
          >
            {!hasContent && !isGenerating ? (
              getEmptyState()
            ) : (
              <PreviewLoadingAnimation />
            )}
          </WebPreviewBody>

          {hasContent && <WebPreviewConsole logs={consoleLogs} />}
        </WebPreview>
      </div>

      <GitHubExportDialog
        open={githubDialogOpen}
        onOpenChange={setGithubDialogOpen}
        chatId={currentChat?.id || null}
        chatTitle={currentChat?.title}
      />

      <UpgradePromptDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature={blockedFeature}
      />
    </>
  );
}
