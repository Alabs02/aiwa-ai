"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon, FileCodeIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  filename?: string;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  filename,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <div
      className={cn(
        "group/code-block not-prose relative w-full overflow-hidden rounded-lg border transition-all duration-300",
        "border-neutral-200 bg-neutral-50/50 backdrop-blur-sm",
        "dark:border-neutral-800 dark:bg-neutral-900/50",
        "hover:ring-2 hover:ring-neutral-500/10 dark:hover:ring-neutral-400/10",
        className,
      )}
      {...props}
    >
      {/* Header with filename and actions */}
      {(filename || children) && (
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-100/50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
          {filename && (
            <div className="flex items-center gap-2">
              <FileCodeIcon className="size-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="font-mono text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {filename}
              </span>
            </div>
          )}
          {children && (
            <div className="ml-auto flex items-center gap-1">{children}</div>
          )}
        </div>
      )}

      {/* Code content */}
      <div className="relative">
        <SyntaxHighlighter
          className="overflow-hidden !bg-transparent dark:hidden"
          codeTagProps={{
            className: "font-mono text-sm",
          }}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            background: "transparent",
            color: "hsl(var(--foreground))",
          }}
          language={language}
          lineNumberStyle={{
            color: "hsl(var(--muted-foreground))",
            paddingRight: "1rem",
            minWidth: "2.5rem",
            userSelect: "none",
          }}
          showLineNumbers={showLineNumbers}
          style={oneLight}
        >
          {code}
        </SyntaxHighlighter>

        <SyntaxHighlighter
          className="hidden overflow-hidden !bg-transparent dark:block"
          codeTagProps={{
            className: "font-mono text-sm",
          }}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            background: "transparent",
            color: "hsl(var(--foreground))",
          }}
          language={language}
          lineNumberStyle={{
            color: "hsl(var(--muted-foreground))",
            paddingRight: "1rem",
            minWidth: "2.5rem",
            userSelect: "none",
          }}
          showLineNumbers={showLineNumbers}
          style={oneDark}
        >
          {code}
        </SyntaxHighlighter>

        {/* Floating copy button */}
        {!children && (
          <div className="absolute right-2 top-2">
            <CodeBlockCopyButton />
          </div>
        )}
      </div>
    </div>
  </CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn(
        "size-7 shrink-0 opacity-0 transition-all duration-200 group-hover/code-block:opacity-100",
        "hover:bg-neutral-200 dark:hover:bg-neutral-700",
        isCopied &&
          "!bg-green-100 text-green-700 dark:!bg-green-900/30 dark:text-green-300",
        className,
      )}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon className="size-3.5" />}
    </Button>
  );
};
