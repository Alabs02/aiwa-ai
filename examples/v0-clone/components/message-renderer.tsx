import React from "react";
import { cn } from "@/lib/utils";
import { sharedComponents } from "./shared-components";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { Message, MessageBinaryFormat } from "@v0-sdk/react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ai-elements/avatar";
import { useCopyToClipboard, useMessageExpansion } from "@/hooks/use-message";

// Function to preprocess message content and remove V0_FILE markers and shell placeholders
function preprocessMessageContent(
  content: MessageBinaryFormat
): MessageBinaryFormat {
  if (!Array.isArray(content)) return content;

  return content.map((row) => {
    if (!Array.isArray(row)) return row;

    // Process text content to remove V0_FILE markers and shell placeholders
    return row.map((item) => {
      if (typeof item === "string") {
        // Remove V0_FILE markers with various patterns
        let processed = item.replace(/\[V0_FILE\][^:]*:file="[^"]*"\n?/g, "");
        processed = processed.replace(/\[V0_FILE\][^\n]*\n?/g, "");

        // Remove shell placeholders with various patterns
        processed = processed.replace(/\.\.\. shell \.\.\./g, "");
        processed = processed.replace(/\.\.\.\s*shell\s*\.\.\./g, "");

        // Remove empty lines that might be left behind
        processed = processed.replace(/\n\s*\n\s*\n/g, "\n\n");
        processed = processed.replace(/^\s*\n+/g, "");
        processed = processed.replace(/\n+\s*$/g, "");
        processed = processed.trim();

        // If the processed string is empty or only whitespace, return empty string
        if (!processed || processed.match(/^\s*$/)) {
          return "";
        }

        return processed;
      }
      return item;
    }) as [number, ...any[]];
  });
}

interface MessageRendererProps {
  content: MessageBinaryFormat | string;
  messageId?: string;
  role: "user" | "assistant";
  className?: string;
  userInitials?: string;
  timestamp?: Date | string;
}

export function MessageRenderer({
  content,
  messageId,
  role,
  className,
  userInitials = "U",
  timestamp
}: MessageRendererProps) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = () => {
    const textContent =
      typeof content === "string" ? content : JSON.stringify(content);
    copyToClipboard(textContent);
  };

  // If content is a string (user message or fallback)
  if (typeof content === "string") {
    const { expanded, isLongMessage, displayContent, toggleExpanded } =
      useMessageExpansion(content, 400);

    if (role === "user") {
      return (
        <div className={cn("group message-item relative mb-6", className)}>
          <div className="flex items-start gap-3">
            <Avatar type="user" initials={userInitials} />
            <div className="min-w-0 flex-1">
              <div className="relative rounded-lg border bg-white/5 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-200">
                    You
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="copy-button h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleCopy}
                    title="Copy message"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    )}
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownPreview
                    source={displayContent}
                    className="text-neutral-300"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, BlinkMacSystemFont, sans-serif",
                      fontSize: "14px",
                      background: "transparent",
                      lineHeight: "1.6"
                    }}
                  />
                </div>
                {isLongMessage && (
                  <button
                    onClick={toggleExpanded}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-100 transition-colors hover:text-neutral-400"
                  >
                    {expanded ? "Show less" : "Show full message"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Assistant message
    return (
      <div className={cn("group message-item relative mb-6", className)}>
        <div className="flex items-start gap-3">
          <Avatar type="assistant" />
          <div className="min-w-0 flex-1">
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  Assistant
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="copy-button h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={handleCopy}
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  )}
                </Button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownPreview
                  source={content}
                  className="text-neutral-300"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: "14px",
                    background: "transparent",
                    lineHeight: "1.6"
                  }}
                />
                {/* <MarkdownPreview
                  source={content}
                  className="text-gray-700 dark:text-gray-300"
                  style={{
                    fontFamily:
                      'Geist, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '14px',
                    background: 'transparent',
                    lineHeight: '1.6',
                  }}
                /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If content is MessageBinaryFormat (from v0 API)
  const processedContent = preprocessMessageContent(content);

  return (
    <div className="group message-item relative mb-6">
      <Message
        content={processedContent}
        messageId={messageId}
        role={role}
        className={className}
        components={sharedComponents}
      />
    </div>
  );
}
