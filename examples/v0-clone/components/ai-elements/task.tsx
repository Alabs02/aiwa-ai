"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  SearchIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileTextIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = ({
  children,
  className,
  ...props
}: TaskItemFileProps) => (
  <div
    className={cn(
      "group/file inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50/50 px-2 py-1 text-xs font-medium text-neutral-700 transition-all duration-200",
      "hover:border-neutral-300 hover:bg-neutral-100/80 hover:shadow-sm",
      "dark:border-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300",
      "dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50",
      className,
    )}
    {...props}
  >
    <FileTextIcon className="size-3 shrink-0 text-neutral-500 transition-colors group-hover/file:text-neutral-700 dark:text-neutral-500 dark:group-hover/file:text-neutral-300" />
    {children}
  </div>
);

export type TaskItemProps = ComponentProps<"div"> & {
  status?: "pending" | "active" | "complete";
};

export const TaskItem = ({
  children,
  className,
  status,
  ...props
}: TaskItemProps) => {
  const statusIcon = {
    pending: (
      <Clock3Icon className="size-3.5 animate-pulse text-amber-500 dark:text-amber-400" />
    ),
    active: (
      <div className="size-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent dark:border-blue-400" />
    ),
    complete: (
      <CheckCircle2Icon className="size-3.5 text-green-600 dark:text-green-400" />
    ),
  };

  return (
    <div
      className={cn(
        "group/item flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200",
        "hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30",
        status === "complete" && "opacity-75",
        className,
      )}
      {...props}
    >
      {status && <div className="mt-0.5 shrink-0">{statusIcon[status]}</div>}
      <div
        className={cn(
          "flex-1 text-neutral-700 dark:text-neutral-300",
          status === "complete" && "line-through",
        )}
      >
        {children}
      </div>
    </div>
  );
};

export type TaskProps = ComponentProps<typeof Collapsible> & {
  status?: "pending" | "active" | "complete";
};

export const Task = ({
  defaultOpen = true,
  status,
  className,
  ...props
}: TaskProps) => (
  <Collapsible
    className={cn(
      "group/task not-prose relative mb-4 overflow-hidden rounded-lg border transition-all duration-300",
      "border-neutral-200/50 bg-gradient-to-br from-neutral-50/50 to-neutral-100/30 backdrop-blur-sm",
      "dark:border-neutral-800/50 dark:from-neutral-900/30 dark:to-neutral-800/20",
      "data-[state=open]:ring-2",
      status === "pending" && "ring-amber-500/10 dark:ring-amber-400/10",
      status === "active" &&
        "animate-pulse-subtle ring-blue-500/10 dark:ring-blue-400/10",
      status === "complete" && "ring-green-500/10 dark:ring-green-400/10",
      !status && "ring-neutral-500/10 dark:ring-neutral-400/10",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className,
    )}
    defaultOpen={defaultOpen}
    {...props}
  />
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
  status?: "pending" | "active" | "complete";
};

export const TaskTrigger = ({
  children,
  className,
  title,
  status,
  ...props
}: TaskTriggerProps) => {
  const statusIcon = {
    pending: (
      <Clock3Icon className="size-4 animate-pulse text-amber-500 dark:text-amber-400" />
    ),
    active: (
      <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent dark:border-blue-400" />
    ),
    complete: (
      <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-400" />
    ),
  };

  return (
    <CollapsibleTrigger
      asChild
      className={cn("group/trigger", className)}
      {...props}
    >
      {children ?? (
        <button className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-neutral-100/50 group-data-[state=open]/task:bg-neutral-100/50 dark:hover:bg-neutral-800/50 dark:group-data-[state=open]/task:bg-neutral-800/30">
          <div className="relative shrink-0">
            {status ? (
              statusIcon[status]
            ) : (
              <SearchIcon className="size-4 text-neutral-600 transition-colors group-hover/trigger:text-neutral-900 dark:text-neutral-400 dark:group-hover/trigger:text-neutral-100" />
            )}
          </div>

          <div className="flex flex-1 items-center gap-2">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {title}
            </span>
            {status === "active" && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                In Progress
              </span>
            )}
          </div>

          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-neutral-500 transition-all duration-300 dark:text-neutral-400",
              "group-hover/trigger:text-neutral-700 dark:group-hover/trigger:text-neutral-200",
              "group-data-[state=open]/task:rotate-180 group-data-[state=open]/task:text-neutral-900 dark:group-data-[state=open]/task:text-neutral-100",
            )}
          />
        </button>
      )}
    </CollapsibleTrigger>
  );
};

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({
  children,
  className,
  ...props
}: TaskContentProps) => (
  <CollapsibleContent
    className={cn(
      "overflow-hidden transition-all duration-300",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className,
    )}
    {...props}
  >
    <div className="border-t border-neutral-200/50 px-4 py-3 dark:border-neutral-800/50">
      <div className="space-y-1 border-l-2 border-neutral-300/50 pl-4 dark:border-neutral-700/50">
        {children}
      </div>
    </div>
  </CollapsibleContent>
);
