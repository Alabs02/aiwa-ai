"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Copy,
  Check,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

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

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  file?: NormalizedFile;
}

interface NormalizedFile {
  lang: string;
  fileName: string;
  content: string;
}

interface CodeViewerProps {
  files: FileItem[];
  chatId?: string;
  chatTitle?: string;
  className?: string;
}

// Normalize file to consistent format
const normalizeFile = (file: FileItem): NormalizedFile | null => {
  // Check if it's v0 API format
  if ("object" in file && file.object === "file") {
    const v0File = file as V0ApiFile;
    return {
      fileName: v0File.name,
      content: v0File.content,
      lang: getLanguageFromPath(v0File.name)
    };
  }

  // Legacy format
  const legacyFile = file as LegacyFileItem;
  if (legacyFile.meta?.fileName) {
    return {
      fileName: legacyFile.meta.fileName,
      content: legacyFile.source,
      lang: legacyFile.lang
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

// Language to syntax highlighting class
const getLanguageClass = (lang: string): string => {
  const langMap: Record<string, string> = {
    typescript: "language-typescript",
    typescriptreact: "language-tsx",
    javascript: "language-javascript",
    javascriptreact: "language-jsx",
    python: "language-python",
    json: "language-json",
    css: "language-css",
    html: "language-html",
    markdown: "language-markdown"
  };
  return langMap[lang] || "language-plaintext";
};

// Build file tree from flat file list
const buildFileTree = (files: NormalizedFile[]): FileNode[] => {
  const root: Record<string, FileNode> = {};

  // Filter out non-code files
  const codeFiles = files.filter((file) => {
    const ext = file.fileName.split(".").pop()?.toLowerCase() || "";
    return (
      file.fileName &&
      file.fileName.length > 0 &&
      !ext.match(/^(png|jpg|jpeg|gif|svg|webp|ico)$/i)
    );
  });

  codeFiles.forEach((file) => {
    const parts = file.fileName.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      if (!currentLevel[part]) {
        if (index === parts.length - 1) {
          // It's a file
          currentLevel[part] = {
            name: part,
            path: file.fileName,
            type: "file",
            file
          };
        } else {
          // It's a folder
          currentLevel[part] = {
            name: part,
            path: parts.slice(0, index + 1).join("/"),
            type: "folder",
            children: []
          };
        }
      }

      if (currentLevel[part].type === "folder" && index < parts.length - 1) {
        if (!currentLevel[part].children) {
          currentLevel[part].children = [];
        }
        const childrenMap: Record<string, FileNode> = {};
        currentLevel[part].children!.forEach((child) => {
          childrenMap[child.name] = child;
        });
        currentLevel = childrenMap;
      }
    });
  });

  // Convert to array and sort
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const flatten = (obj: Record<string, FileNode>): FileNode[] => {
    return Object.values(obj).map((node) => {
      if (node.children && node.children.length > 0) {
        node.children = sortNodes(
          flatten(
            node.children.reduce(
              (acc, child) => {
                acc[child.name] = child;
                return acc;
              },
              {} as Record<string, FileNode>
            )
          )
        );
      }
      return node;
    });
  };

  return sortNodes(flatten(root));
};

// File Tree Node Component
interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  selectedPath: string | null;
  onSelect: (node: FileNode) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

function FileTreeNode({
  node,
  level,
  selectedPath,
  onSelect,
  expandedFolders,
  onToggleFolder
}: FileTreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (node.type === "folder") {
      onToggleFolder(node.path);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/[0.08]",
          isSelected && "bg-white/[0.12]"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.type === "folder" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-white/40" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-orange-400" />
            ) : (
              <Folder className="h-4 w-4 text-orange-400" />
            )}
          </>
        ) : (
          <>
            <div className="w-3.5" />
            <File className="h-4 w-4 text-white/60" />
          </>
        )}
        <span className="truncate text-white/90">{node.name}</span>
      </button>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CodeViewer({
  files,
  chatId,
  chatTitle,
  className
}: CodeViewerProps) {
  // Normalize all files
  const normalizedFiles = useMemo(
    () =>
      files.map(normalizeFile).filter((f): f is NormalizedFile => f !== null),
    [files]
  );

  const fileTree = useMemo(
    () => buildFileTree(normalizedFiles),
    [normalizedFiles]
  );

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(
    fileTree.find((node) => node.type === "file") || null
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(fileTree.filter((n) => n.type === "folder").map((n) => n.path))
  );
  const [copied, setCopied] = useState(false);

  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCopyCode = async () => {
    if (!selectedFile?.file?.content) return;
    try {
      await navigator.clipboard.writeText(selectedFile.file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleDownload = async () => {
    if (!chatId) return;
    try {
      const response = await fetch(
        `/api/chat/download?chatId=${chatId}&format=zip&includeDefaultFiles=true`
      );
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${chatTitle || chatId}-code.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <div className={cn("flex h-full flex-col bg-black", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-white">Files</span>
          <span className="text-xs text-white/40">
            ({normalizedFiles.length})
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleDownload}
                disabled={!chatId}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download as ZIP</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 border-r border-white/[0.08] bg-white/[0.02]">
          <ScrollArea className="h-full">
            <div className="py-2">
              {fileTree.length > 0 ? (
                fileTree.map((node) => (
                  <FileTreeNode
                    key={node.path}
                    node={node}
                    level={0}
                    selectedPath={selectedFile?.path || null}
                    onSelect={setSelectedFile}
                    expandedFolders={expandedFolders}
                    onToggleFolder={handleToggleFolder}
                  />
                ))
              ) : (
                <div className="px-4 py-8 text-center text-xs text-white/40">
                  No code files available
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Code Display */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedFile?.file ? (
            <>
              {/* File Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-2">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-white/60" />
                  <span className="font-mono text-sm text-white/90">
                    {selectedFile.path}
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleCopyCode}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "Copied!" : "Copy code"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Code Content */}
              <ScrollArea className="flex-1 shrink-0 overflow-y-auto">
                <pre className="p-4 font-mono text-sm leading-relaxed">
                  <code
                    className={cn(
                      "text-white/80",
                      getLanguageClass(selectedFile.file.lang)
                    )}
                  >
                    {selectedFile.file.content}
                  </code>
                </pre>
              </ScrollArea>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-white/40">
              <div className="text-center">
                <File className="mx-auto mb-2 h-12 w-12" />
                <p className="text-sm">Select a file to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
