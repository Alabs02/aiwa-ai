"use client";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
  Loader2Icon
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn(
      "group/tool not-prose mb-4 w-full overflow-hidden rounded-lg border transition-all duration-300",
      "border-neutral-200/50 bg-gradient-to-br from-neutral-50/50 to-neutral-100/30 backdrop-blur-sm",
      "dark:border-neutral-800/50 dark:from-neutral-900/30 dark:to-neutral-800/20",
      "data-[state=open]:ring-2 data-[state=open]:ring-neutral-500/10 dark:data-[state=open]:ring-neutral-400/10",
      className
    )}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolUIPart["type"];
  state: ToolUIPart["state"];
  className?: string;
};

const getStatusConfig = (status: ToolUIPart["state"]) => {
  const config = {
    "input-streaming": {
      label: "Pending",
      icon: <CircleIcon className="size-3.5 text-neutral-400" />,
      badgeVariant: "secondary" as const,
      badgeClass:
        "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
    },
    "input-available": {
      label: "Running",
      icon: (
        <Loader2Icon className="size-3.5 animate-spin text-blue-500 dark:text-blue-400" />
      ),
      badgeVariant: "secondary" as const,
      badgeClass:
        "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 animate-pulse-subtle"
    },
    "output-available": {
      label: "Completed",
      icon: (
        <CheckCircleIcon className="size-3.5 text-green-600 dark:text-green-400" />
      ),
      badgeVariant: "secondary" as const,
      badgeClass:
        "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    },
    "output-error": {
      label: "Error",
      icon: <XCircleIcon className="size-3.5 text-red-600 dark:text-red-400" />,
      badgeVariant: "destructive" as const,
      badgeClass: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    }
  } as const;

  return config[status];
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => {
  const statusConfig = getStatusConfig(state);

  return (
    <CollapsibleTrigger
      className={cn(
        "group/trigger flex w-full items-center justify-between gap-4 px-4 py-3 transition-all duration-200",
        "hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50",
        "group-data-[state=open]/tool:bg-neutral-100/50 dark:group-data-[state=open]/tool:bg-neutral-800/30",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <WrenchIcon className="size-4 text-neutral-600 transition-colors group-hover/trigger:text-neutral-900 dark:text-neutral-400 dark:group-hover/trigger:text-neutral-100" />
          {state === "input-available" && (
            <div className="absolute -top-0.5 -right-0.5 size-1.5 animate-ping rounded-full bg-blue-500 dark:bg-blue-400" />
          )}
        </div>
        <span className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {type}
        </span>
        <Badge
          className={cn(
            "gap-1.5 rounded-full border-0 px-2 py-0.5 text-xs font-semibold transition-all duration-200",
            statusConfig.badgeClass
          )}
          variant={statusConfig.badgeVariant}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </div>
      <ChevronDownIcon
        className={cn(
          "size-4 shrink-0 text-neutral-500 transition-all duration-300 dark:text-neutral-400",
          "group-hover/trigger:text-neutral-700 dark:group-hover/trigger:text-neutral-200",
          "group-data-[state=open]/tool:rotate-180 group-data-[state=open]/tool:text-neutral-900 dark:group-data-[state=open]/tool:text-neutral-100"
        )}
      />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "overflow-hidden transition-all duration-300",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div
    className={cn(
      "space-y-3 overflow-hidden border-t border-neutral-200/50 p-4 dark:border-neutral-800/50",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <div className="size-1 rounded-full bg-blue-500 dark:bg-blue-400" />
      <h4 className="text-xs font-semibold tracking-wider text-neutral-600 uppercase dark:text-neutral-400">
        Parameters
      </h4>
    </div>
    <div className="overflow-hidden rounded-md ring-1 ring-neutral-200 dark:ring-neutral-800">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ReactNode;
  errorText: ToolUIPart["errorText"];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-3 border-t border-neutral-200/50 p-4 dark:border-neutral-800/50",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "size-1 rounded-full",
            errorText
              ? "bg-red-500 dark:bg-red-400"
              : "bg-green-500 dark:bg-green-400"
          )}
        />
        <h4
          className={cn(
            "text-xs font-semibold tracking-wider uppercase",
            errorText
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400"
          )}
        >
          {errorText ? "Error" : "Result"}
        </h4>
      </div>
      <div
        className={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          errorText
            ? "bg-red-50/50 p-4 text-red-700 ring-1 ring-red-200 dark:bg-red-900/10 dark:text-red-300 dark:ring-red-800"
            : "bg-neutral-50/50 p-4 text-neutral-700 ring-1 ring-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:ring-neutral-800"
        )}
      >
        {errorText && <div className="font-medium">{errorText}</div>}
        {output && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {output}
          </div>
        )}
      </div>
    </div>
  );
};
