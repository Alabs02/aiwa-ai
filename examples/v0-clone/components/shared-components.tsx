import React from "react";
import {
  CodeBlock,
  MathPart,
  ThinkingSectionProps,
  TaskSectionProps,
  CodeProjectPartProps
} from "@v0-sdk/react";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent
} from "@/components/ai-elements/reasoning";
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
  TaskItemFile
} from "@/components/ai-elements/task";
import { FileIcon, FolderIcon } from "lucide-react";

// ===============================================
// THINKING SECTION WRAPPER
// ===============================================
export const ThinkingSectionWrapper = ({
  title,
  duration,
  thought,
  collapsed,
  onCollapse,
  children,
  ...props
}: ThinkingSectionProps) => {
  return (
    <Reasoning
      duration={duration ? Math.round(duration) : undefined}
      defaultOpen={!collapsed}
      onOpenChange={(open) => onCollapse?.()}
      {...props}
    >
      <ReasoningTrigger title={title || "Thinking"} />
      <ReasoningContent>
        {thought ||
          (typeof children === "string" ? children : "Processing thoughts...")}
      </ReasoningContent>
    </Reasoning>
  );
};

// ===============================================
// CODE PROJECT WRAPPER
// ===============================================

// Helper to clean V0_FILE markers and shell placeholders
const cleanCodeContent = (content: string): string => {
  if (!content) return "";

  // Remove V0_FILE markers with various patterns
  let cleaned = content.replace(/\[V0_FILE\][^:]*:file="[^"]*"\n?/g, "");
  cleaned = cleaned.replace(/\[V0_FILE\][^\n]*\n?/g, "");

  // Remove shell placeholders
  cleaned = cleaned.replace(/\.\.\.\s*shell\s*\.\.\./g, "");

  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.trim();

  return cleaned;
};

const CodeProjectPartWrapper = ({
  title,
  filename,
  code,
  language = "typescript",
  collapsed = false,
  children,
  ...props
}: CodeProjectPartProps) => {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  // Extract files from props if this is a code project
  const codeProjectPart = props as any;
  const files = codeProjectPart.changedFiles || [];
  const hasMultipleFiles = files.length > 1;

  // Clean the code content
  const cleanedCode = cleanCodeContent(code || codeProjectPart.source || "");

  return (
    <div className="not-prose group/code-project mb-4 overflow-hidden rounded-lg border border-neutral-200/50 bg-gradient-to-br from-neutral-50/50 to-neutral-100/30 backdrop-blur-sm transition-all duration-300 dark:border-neutral-800/50 dark:from-neutral-900/30 dark:to-neutral-800/20">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-all duration-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-neutral-100 p-1.5 dark:bg-neutral-800">
            <FolderIcon className="size-4 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {title || "Code Project"}
            </span>
            {hasMultipleFiles && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <svg
          className={`size-4 text-neutral-500 transition-transform duration-300 dark:text-neutral-400 ${
            isCollapsed ? "" : "rotate-90"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="border-t border-neutral-200/50 dark:border-neutral-800/50">
          {children || (
            <div className="p-4">
              {/* Main file display */}
              <div className="flex items-center gap-2 text-sm">
                <FileIcon className="size-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
                <span className="font-mono text-neutral-900 dark:text-neutral-100">
                  {filename ||
                    files[0]?.fileName ||
                    files[0]?.baseName ||
                    "app/page.tsx"}
                </span>
              </div>

              {/* Additional files if multiple */}
              {hasMultipleFiles && (
                <div className="mt-3 space-y-1.5 pl-6">
                  {files.slice(1).map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400"
                    >
                      <FileIcon className="size-3 shrink-0" />
                      <span className="font-mono">
                        {file.fileName || file.baseName || `file-${index + 2}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===============================================
// TASK SECTION WRAPPER
// ===============================================
const parseTaskStatus = (
  parts: any[]
): "pending" | "active" | "complete" | undefined => {
  if (!Array.isArray(parts) || parts.length === 0) return undefined;

  const hasComplete = parts.some(
    (p) =>
      p &&
      typeof p === "object" &&
      (p.status === "complete" ||
        p.type === "diagnostics-passed" ||
        p.type === "finished-web-search")
  );

  const hasActive = parts.some(
    (p) =>
      p &&
      typeof p === "object" &&
      (p.status === "searching" ||
        p.status === "analyzing" ||
        p.status === "reading" ||
        p.type === "fetching-diagnostics" ||
        p.type === "starting-web-search" ||
        p.type === "starting-repo-search")
  );

  if (hasComplete) return "complete";
  if (hasActive) return "active";
  return "pending";
};

export const TaskSectionWrapper = ({
  title,
  type,
  parts = [],
  collapsed,
  onCollapse,
  children,
  ...props
}: TaskSectionProps) => {
  const status = parseTaskStatus(parts);

  return (
    <Task
      status={status}
      className="mb-4 w-full"
      defaultOpen={!collapsed}
      onOpenChange={(open) => onCollapse?.()}
    >
      <TaskTrigger title={title || type || "Task"} status={status} />
      <TaskContent>
        {parts && parts.length > 0
          ? parts.map((part, index) => renderTaskPart(part, index))
          : children}
      </TaskContent>
    </Task>
  );
};

// Helper to render individual task parts
const renderTaskPart = (part: any, index: number): React.ReactNode => {
  if (typeof part === "string") {
    return <TaskItem key={index}>{part}</TaskItem>;
  }

  if (!part || typeof part !== "object") return null;

  // Starting design inspiration
  if (part.type === "starting-design-inspiration" && part.prompt) {
    return (
      <TaskItem key={index} status="active">
        <div className="space-y-2">
          <div className="font-medium">Generating design inspiration</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            {part.prompt}
          </div>
        </div>
      </TaskItem>
    );
  }

  // Finished design inspiration
  if (part.type === "finished-design-inspiration") {
    return (
      <TaskItem key={index} status="complete">
        ✓ Design inspiration generated
      </TaskItem>
    );
  }

  // Starting repo search
  if (part.type === "starting-repo-search" && part.query) {
    return (
      <TaskItem key={index} status="active">
        Searching: "{part.query}"
      </TaskItem>
    );
  }

  // Select files
  if (part.type === "select-files" && Array.isArray(part.filePaths)) {
    return (
      <TaskItem key={index} status="active">
        Reading{" "}
        {part.filePaths.map((file: string, i: number) => (
          <TaskItemFile key={i}>{file.split("/").pop()}</TaskItemFile>
        ))}
      </TaskItem>
    );
  }

  // Starting web search
  if (part.type === "starting-web-search" && part.query) {
    return (
      <TaskItem key={index} status="active">
        Searching web: "{part.query}"
      </TaskItem>
    );
  }

  // Got results
  if (part.type === "got-results" && part.count) {
    return (
      <TaskItem key={index} status="active">
        Analyzing {part.count} results...
      </TaskItem>
    );
  }

  // Finished web search
  if (part.type === "finished-web-search" && part.answer) {
    return (
      <TaskItem key={index} status="complete">
        {part.answer}
      </TaskItem>
    );
  }

  // Fetching diagnostics
  if (part.type === "fetching-diagnostics") {
    return (
      <TaskItem key={index} status="active">
        Checking for issues...
      </TaskItem>
    );
  }

  // Diagnostics passed
  if (part.type === "diagnostics-passed") {
    return (
      <TaskItem key={index} status="complete">
        ✓ No issues found
      </TaskItem>
    );
  }

  // Reading file
  if (part.type === "reading-file" && part.filePath) {
    return (
      <TaskItem key={index} status="active">
        Reading <TaskItemFile>{part.filePath}</TaskItemFile>
      </TaskItem>
    );
  }

  // Code project
  if (part.type === "code-project" && part.source) {
    return (
      <CodeProjectPartWrapper
        key={index}
        title="Generated Code"
        code={part.source}
        language={part.language || "typescript"}
        {...part}
      />
    );
  }

  // Hide technical/empty objects
  if (
    part.type &&
    (part.type.includes("start") ||
      part.type.includes("end") ||
      Object.keys(part).length <= 1)
  ) {
    return null;
  }

  // Format remaining objects nicely
  const displayKeys = Object.keys(part).filter(
    (key) => key !== "type" && part[key] && part[key].toString().length > 0
  );

  if (displayKeys.length === 0) return null;

  return (
    <TaskItem key={index}>
      <div className="space-y-1">
        {displayKeys.map((key) => (
          <div key={key} className="text-xs">
            <span className="font-medium text-neutral-700 capitalize dark:text-neutral-300">
              {key.replace(/_/g, " ")}:{" "}
            </span>
            <span className="text-neutral-600 dark:text-neutral-400">
              {typeof part[key] === "object"
                ? JSON.stringify(part[key])
                : part[key].toString()}
            </span>
          </div>
        ))}
      </div>
    </TaskItem>
  );
};

// ===============================================
// CUSTOM TASK SECTION FOR CODE PROJECTS
// ===============================================
const CustomTaskSectionWrapper = (props: any) => {
  // If this task contains code project parts, render as CodeProjectPart
  if (
    props.parts &&
    props.parts.some(
      (part: any) =>
        part && typeof part === "object" && part.type === "code-project"
    )
  ) {
    const codeProjectPart = props.parts.find(
      (part: any) =>
        part && typeof part === "object" && part.type === "code-project"
    );

    if (codeProjectPart) {
      return (
        <CodeProjectPartWrapper
          title={props.title || "Code Project"}
          filename={codeProjectPart.changedFiles?.[0]?.fileName || "project"}
          code={codeProjectPart.source || ""}
          language="typescript"
          collapsed={false}
          {...codeProjectPart}
        />
      );
    }
  }

  // Handle design inspiration task
  if (props.type === "task-generate-design-inspiration-v1") {
    return (
      <TaskSectionWrapper
        {...props}
        title={props.title || "Design Inspiration"}
      />
    );
  }

  // Handle other task types by extracting a friendly name
  if (
    props.type &&
    props.type.startsWith("task-") &&
    props.type.endsWith("-v1")
  ) {
    const taskName = props.type
      .replace("task-", "")
      .replace("-v1", "")
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <TaskSectionWrapper
        {...props}
        title={
          props.title ||
          props.taskNameComplete ||
          props.taskNameActive ||
          taskName
        }
      />
    );
  }

  // Default task rendering
  return <TaskSectionWrapper {...props} />;
};

// ===============================================
// SHARED COMPONENTS EXPORT
// ===============================================
export const sharedComponents = {
  // AI Elements components for structured content
  ThinkingSection: ThinkingSectionWrapper,
  TaskSection: CustomTaskSectionWrapper,
  CodeProjectPart: CodeProjectPartWrapper,
  CodeBlock,
  MathPart,

  // Styled HTML elements with glassmorphic theme
  p: {
    className:
      "my-4 leading-relaxed text-neutral-700 dark:text-neutral-300 last:mb-0 first:mt-0"
  },
  h1: {
    className:
      "mb-4 mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100 first:mt-0"
  },
  h2: {
    className:
      "mb-3 mt-5 text-xl font-semibold text-neutral-900 dark:text-neutral-100 first:mt-0"
  },
  h3: {
    className:
      "mb-2 mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100 first:mt-0"
  },
  ul: {
    className:
      "my-4 space-y-2 pl-6 text-neutral-700 dark:text-neutral-300 last:mb-0 first:mt-0 [&>li]:list-disc"
  },
  ol: {
    className:
      "my-4 space-y-2 pl-6 text-neutral-700 dark:text-neutral-300 last:mb-0 first:mt-0 [&>li]:list-decimal"
  },
  li: {
    className: "leading-relaxed"
  },
  code: {
    className:
      "rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
  },
  pre: {
    className:
      "my-4 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm dark:bg-neutral-950 last:mb-0 first:mt-0"
  },
  blockquote: {
    className:
      "my-4 border-l-4 border-neutral-300 pl-4 italic text-neutral-600 dark:border-neutral-700 dark:text-neutral-400 last:mb-0 first:mt-0"
  },
  a: {
    className:
      "text-blue-600 underline decoration-blue-600/30 underline-offset-2 transition-all duration-200 hover:text-blue-700 hover:decoration-blue-700/50 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:text-blue-300 dark:hover:decoration-blue-300/50"
  },
  table: {
    className:
      "my-4 w-full border-collapse overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50/50 text-sm dark:border-neutral-800 dark:bg-neutral-900/30 last:mb-0 first:mt-0"
  },
  thead: {
    className: "bg-neutral-100 dark:bg-neutral-800"
  },
  th: {
    className:
      "border border-neutral-200 px-4 py-2 text-left font-semibold text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
  },
  td: {
    className:
      "border border-neutral-200 px-4 py-2 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
  },
  hr: {
    className: "my-6 border-neutral-200 dark:border-neutral-800"
  },
  strong: {
    className: "font-semibold text-neutral-900 dark:text-neutral-100"
  },
  em: {
    className: "italic"
  }
};
