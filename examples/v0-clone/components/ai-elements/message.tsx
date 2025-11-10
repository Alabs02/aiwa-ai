import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import type { UIMessage } from "ai";
import type { ComponentProps, HTMLAttributes } from "react";
import { useState, useCallback } from "react";

// Hook for copy functionality
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return { copied, copyToClipboard };
}

// Hook for message expansion
function useMessageExpansion(content: string, threshold: number = 400) {
  const [expanded, setExpanded] = useState(false);
  const isLongMessage = content.length > threshold;
  const displayContent =
    !expanded && isLongMessage ? content.slice(0, threshold) + "..." : content;

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return { expanded, isLongMessage, displayContent, toggleExpanded };
}

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group message-item relative mb-6",
      from === "user" ? "is-user" : "is-assistant",
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> & {
  content?: string;
  enableMarkdown?: boolean;
  enableCopy?: boolean;
  enableExpansion?: boolean;
  expansionThreshold?: number;
};

export const MessageContent = ({
  children,
  content,
  className,
  enableMarkdown = true,
  enableCopy = true,
  enableExpansion = true,
  expansionThreshold = 400,
  ...props
}: MessageContentProps) => {
  const { copied, copyToClipboard } = useCopyToClipboard();
  const isUser = className?.includes("is-user");

  // Determine the text content for operations
  const textContent = content || (typeof children === "string" ? children : "");

  const { expanded, isLongMessage, displayContent, toggleExpanded } =
    useMessageExpansion(textContent, expansionThreshold);

  const handleCopy = () => {
    copyToClipboard(textContent);
  };

  // Render content based on settings
  const renderContent = () => {
    if (!enableMarkdown || !textContent) {
      return <div className="is-user:dark">{children}</div>;
    }

    const contentToShow = enableExpansion ? displayContent : textContent;

    return (
      <>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownPreview
            source={contentToShow}
            className={cn(
              isUser ? "text-neutral-300" : "text-gray-700 dark:text-gray-300"
            )}
            style={{
              fontFamily:
                "Geist, -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "14px",
              background: "transparent",
              lineHeight: "1.6"
            }}
          />
        </div>
        {enableExpansion && isLongMessage && (
          <button
            onClick={toggleExpanded}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
          >
            {expanded ? "Show less" : "Show full message"}
          </button>
        )}
      </>
    );
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-sm transition-all duration-300",
        "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
        "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
        "group-[.is-user]:border group-[.is-user]:bg-white/5 group-[.is-user]:shadow-sm hover:shadow-md",
        className
      )}
      {...props}
    >
      {enableCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleCopy}
          title="Copy message"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          )}
        </Button>
      )}
      {renderContent()}
    </div>
  );
};

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src?: string;
  name?: string;
  type?: "user" | "assistant";
  initials?: string;
};

export const MessageAvatar = ({
  src,
  name,
  type,
  initials,
  className,
  ...props
}: MessageAvatarProps) => {
  const displayInitials =
    initials || name?.slice(0, 2) || (type === "user" ? "U" : "AI");

  return (
    <Avatar
      className={cn(
        "ring-border size-8 shrink-0 ring-1",
        type === "assistant" && "bg-primary text-primary-foreground",
        className
      )}
      {...props}
    >
      {type === "assistant" && (
        <AvatarImage
          alt=""
          className="bg-background/85 mt-0 mb-0"
          src={"/AI-Light.webp"}
        />
      )}

      {type === "user" && !src && (
        <AvatarImage
          alt={initials || name || "User Avatar"}
          src={`https://ui-avatars.com/api/?name=${initials}&background=737373&color=fff&rounded=true&size=64`}
        />
      )}
      <AvatarFallback className="text-xs font-semibold">
        {displayInitials}
      </AvatarFallback>
    </Avatar>
  );
};
