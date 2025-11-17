"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FileIcon, FolderIcon, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Support both v0 API format and legacy format
interface V0ApiFile {
  object: "file";
  name: string;
  content: string;
  locked: boolean;
}

interface LegacyStreamingFile {
  lang: string;
  meta: {
    fileName: string;
  };
  source: string;
  isGenerating?: boolean;
}

type StreamingFile = V0ApiFile | LegacyStreamingFile;

interface StreamingCodePreviewProps {
  files: StreamingFile[];
  className?: string;
}

interface NormalizedStreamingFile {
  fileName: string;
  content: string;
  lang: string;
  isGenerating?: boolean;
}

// Normalize file to consistent format
const normalizeFile = (file: StreamingFile): NormalizedStreamingFile | null => {
  // Check if it's v0 API format
  if ("object" in file && file.object === "file") {
    const v0File = file as V0ApiFile;
    return {
      fileName: v0File.name,
      content: v0File.content,
      lang: getLanguageFromPath(v0File.name),
      isGenerating: false
    };
  }

  // Legacy format
  const legacyFile = file as LegacyStreamingFile;
  if (legacyFile.meta?.fileName) {
    return {
      fileName: legacyFile.meta.fileName,
      content: legacyFile.source,
      lang: legacyFile.lang,
      isGenerating: legacyFile.isGenerating
    };
  }

  return null;
};

// Get language from file path
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

/**
 * StreamingCodePreview - Shows files being generated in real-time
 * Similar to Lovable's code preview during generation
 */
export function StreamingCodePreview({
  files,
  className
}: StreamingCodePreviewProps) {
  const [visibleLines, setVisibleLines] = useState<Record<string, number>>({});

  // Normalize all files
  const normalizedFiles = files
    .map(normalizeFile)
    .filter((f): f is NormalizedStreamingFile => f !== null);

  // Filter out non-code files (images, etc.)
  const codeFiles = normalizedFiles.filter((file) => {
    const ext = file.fileName.split(".").pop()?.toLowerCase() || "";
    return (
      file.fileName &&
      !ext.match(/^(png|jpg|jpeg|gif|svg|webp|ico)$/i) &&
      file.content
    );
  });

  // Animate code appearing line by line for currently generating file
  useEffect(() => {
    const generatingFile = codeFiles.find((f) => f.isGenerating);
    if (generatingFile) {
      const fileName = generatingFile.fileName;
      const lines = generatingFile.content.split("\n");

      let currentLine = visibleLines[fileName] || 0;

      if (currentLine < lines.length) {
        const timer = setTimeout(() => {
          setVisibleLines((prev) => ({
            ...prev,
            [fileName]: Math.min(currentLine + 3, lines.length) // Show 3 lines at a time
          }));
        }, 50); // Adjust speed as needed

        return () => clearTimeout(timer);
      }
    }
  }, [codeFiles, visibleLines]);

  if (codeFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-white/40" />
          <p className="text-sm text-white/60">Generating code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col bg-black", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-white">
            Generating Files
          </span>
          <span className="text-xs text-white/40">({codeFiles.length})</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File List Sidebar */}
        <div className="w-64 border-r border-white/[0.08] bg-white/[0.02]">
          <ScrollArea className="h-full">
            <div className="py-2">
              {codeFiles.map((file, index) => {
                const fileName = file.fileName;
                const isGenerating = file.isGenerating;
                const isComplete = !isGenerating && file.content;

                return (
                  <div
                    key={fileName || index}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
                      isGenerating && "bg-white/[0.08]"
                    )}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                    ) : isComplete ? (
                      <div className="h-3 w-3 rounded-full bg-green-500/60" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-white/20" />
                    )}
                    <FileIcon className="h-3.5 w-3.5 text-white/60" />
                    <span className="truncate font-mono text-xs text-white/90">
                      {fileName.split("/").pop()}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Code Display */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              {codeFiles.map((file, index) => {
                const fileName = file.fileName;
                const isGenerating = file.isGenerating;
                const lines = file.content.split("\n");
                const displayLines = isGenerating
                  ? lines.slice(0, visibleLines[fileName] || 0)
                  : lines;

                return (
                  <div key={fileName || index} className="space-y-2">
                    {/* File Header */}
                    <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
                      <FileIcon className="h-3.5 w-3.5 text-white/60" />
                      <span className="font-mono text-xs text-white/90">
                        {fileName}
                      </span>
                      {isGenerating && (
                        <Loader2 className="ml-auto h-3 w-3 animate-spin text-orange-400" />
                      )}
                    </div>

                    {/* Code Content */}
                    <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
                      <code className="text-white/80">
                        {displayLines.join("\n")}
                        {isGenerating && (
                          <span className="animate-pulse text-orange-400">
                            ▊
                          </span>
                        )}
                      </code>
                    </pre>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
