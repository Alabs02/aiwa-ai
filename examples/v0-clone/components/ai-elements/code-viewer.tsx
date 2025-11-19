"use client";

import { useState, useMemo, type ReactElement } from "react";
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

// Syntax highlighting component
function SyntaxHighlightedCode({ code, lang }: { code: string; lang: string }) {
  const highlightCode = (text: string, language: string) => {
    // Simple token-based highlighting
    const patterns: Record<string, { pattern: RegExp; className: string }[]> = {
      typescript: [
        {
          pattern:
            /(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|try|catch|throw|new)\b/g,
          className: "text-purple-400"
        },
        { pattern: /('.*?'|".*?"|`.*?`)/g, className: "text-green-400" },
        { pattern: /\/\/.*/g, className: "text-gray-500 italic" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "text-gray-500 italic" },
        { pattern: /\b(\d+)\b/g, className: "text-orange-400" },
        {
          pattern: /\b(true|false|null|undefined)\b/g,
          className: "text-orange-400"
        }
      ],
      typescriptreact: [
        {
          pattern:
            /(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|try|catch|throw|new)\b/g,
          className: "text-purple-400"
        },
        { pattern: /('.*?'|".*?"|`.*?`)/g, className: "text-green-400" },
        { pattern: /\/\/.*/g, className: "text-gray-500 italic" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "text-gray-500 italic" },
        { pattern: /<\/?[\w\s="/.':;#-\/\?]+>/gi, className: "text-blue-400" },
        { pattern: /\b(\d+)\b/g, className: "text-orange-400" },
        {
          pattern: /\b(true|false|null|undefined)\b/g,
          className: "text-orange-400"
        }
      ],
      css: [
        { pattern: /([.#][\w-]+)/g, className: "text-yellow-400" },
        { pattern: /([\w-]+):/g, className: "text-blue-400" },
        { pattern: /('.*?'|".*?")/g, className: "text-green-400" },
        { pattern: /\/\*[\s\S]+?\*\//g, className: "text-gray-500 italic" }
      ],
      json: [
        { pattern: /"(\\.|[^"\\])*"/g, className: "text-green-400" },
        { pattern: /\b(\d+)\b/g, className: "text-orange-400" },
        { pattern: /\b(true|false|null)\b/g, className: "text-orange-400" }
      ]
    };

    const langPatterns = patterns[language] || patterns.typescript;
    let highlighted = text;
    const tokens: Array<{
      start: number;
      end: number;
      className: string;
      text: string;
    }> = [];

    // Find all matches
    langPatterns.forEach(({ pattern, className }) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match) => {
        if (match.index !== undefined) {
          tokens.push({
            start: match.index,
            end: match.index + match[0].length,
            className,
            text: match[0]
          });
        }
      });
    });

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);

    // Build highlighted output
    const parts: ReactElement[] = [];
    let lastIndex = 0;

    tokens.forEach((token, i) => {
      // Skip overlapping tokens
      if (token.start < lastIndex) return;

      // Add text before token
      if (token.start > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {text.substring(lastIndex, token.start)}
          </span>
        );
      }

      // Add highlighted token
      parts.push(
        <span key={`token-${i}`} className={token.className}>
          {token.text}
        </span>
      );

      lastIndex = token.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  return <>{highlightCode(code, lang)}</>;
}

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
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join("/");

      if (!currentLevel[part]) {
        if (isFile) {
          // It's a file
          currentLevel[part] = {
            name: part,
            path,
            type: "file",
            file
          };
        } else {
          // It's a folder
          currentLevel[part] = {
            name: part,
            path,
            type: "folder",
            children: []
          };
        }
      }

      // Navigate deeper for folders
      if (!isFile && currentLevel[part].type === "folder") {
        // Get or create children map
        if (!currentLevel[part].children) {
          currentLevel[part].children = [];
        }

        // Convert children array to map for next iteration
        const childrenMap: Record<string, FileNode> = {};
        currentLevel[part].children!.forEach((child) => {
          childrenMap[child.name] = child;
        });

        // Update current level to this folder's children
        currentLevel = childrenMap;
      }
    });
  });

  // Convert root object to sorted array
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Recursively convert object structure to arrays and sort
  const convertToArray = (obj: Record<string, FileNode>): FileNode[] => {
    return Object.values(obj).map((node) => {
      if (node.type === "folder" && node.children) {
        // Build children map from the folder structure
        const buildChildrenMap = (
          folderPath: string
        ): Record<string, FileNode> => {
          const childMap: Record<string, FileNode> = {};

          codeFiles.forEach((file) => {
            if (file.fileName.startsWith(folderPath + "/")) {
              const relativePath = file.fileName.substring(
                folderPath.length + 1
              );
              const nextPart = relativePath.split("/")[0];
              const isDirectChild = !relativePath
                .substring(nextPart.length + 1)
                .includes("/");
              const childPath = folderPath + "/" + nextPart;

              if (!childMap[nextPart]) {
                if (isDirectChild && relativePath === nextPart) {
                  // Direct file child
                  childMap[nextPart] = {
                    name: nextPart,
                    path: childPath,
                    type: "file",
                    file
                  };
                } else {
                  // Subfolder
                  childMap[nextPart] = {
                    name: nextPart,
                    path: childPath,
                    type: "folder",
                    children: []
                  };
                }
              }
            }
          });

          return childMap;
        };

        const childrenMap = buildChildrenMap(node.path);
        node.children = sortNodes(convertToArray(childrenMap));
      }
      return node;
    });
  };

  return sortNodes(convertToArray(root));
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
              <ScrollArea className="h-full flex-1">
                <pre className="p-4 font-mono text-sm leading-relaxed">
                  <code className="text-white/80">
                    <SyntaxHighlightedCode
                      code={selectedFile.file.content}
                      lang={selectedFile.file.lang}
                    />
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
