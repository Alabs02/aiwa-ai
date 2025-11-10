"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext, useEffect, useState } from "react";
import { Response } from "./response";

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1500;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = false,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange
    });
    const [duration, setDuration] = useControllableState({
      prop: durationProp,
      defaultProp: 0
    });

    const [hasAutoClosedRef, setHasAutoClosedRef] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [hasCompletedOnce, setHasCompletedOnce] = useState(false);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTime === null) {
          setStartTime(Date.now());
        }
      } else if (startTime !== null) {
        setDuration(Math.round((Date.now() - startTime) / 1000));
        setStartTime(null);
        setHasCompletedOnce(true);
      }
    }, [isStreaming, startTime, setDuration]);

    // Auto-open when streaming starts, auto-close when streaming ends
    useEffect(() => {
      if (isStreaming && !isOpen) {
        setIsOpen(true);
        setHasAutoClosedRef(false);
      } else if (!isStreaming && isOpen && !defaultOpen && !hasAutoClosedRef) {
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosedRef(true);
        }, AUTO_CLOSE_DELAY);
        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosedRef]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      if (newOpen) {
        setHasAutoClosedRef(true); // Prevent auto-close after manual open
      }
    };

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen, duration }}
      >
        <Collapsible
          className={cn(
            "not-prose group/reasoning relative mb-4 overflow-hidden rounded-lg border border-neutral-200/50 bg-gradient-to-br from-neutral-50/50 to-neutral-100/30 backdrop-blur-sm transition-all duration-300 dark:border-neutral-800/50 dark:from-neutral-900/30 dark:to-neutral-800/20",
            isOpen && "ring-2 ring-purple-500/10 dark:ring-purple-400/10",
            isStreaming && "animate-pulse-subtle",
            hasCompletedOnce &&
              !isStreaming &&
              "ring-2 ring-green-500/10 dark:ring-green-400/10",
            className
          )}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  title?: string;
};

export const ReasoningTrigger = memo(
  ({
    className,
    title = "Reasoning",
    children,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "group/trigger flex w-full items-center gap-3 px-4 py-3 text-sm transition-all duration-200",
          "hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50",
          isOpen && "bg-neutral-100/50 dark:bg-neutral-800/30",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <div className="relative">
              {isStreaming ? (
                <div className="relative">
                  <BrainIcon className="size-4 text-purple-600 dark:text-purple-400" />
                  <SparklesIcon className="absolute -top-1 -right-1 size-2.5 animate-pulse text-purple-500 dark:text-purple-300" />
                </div>
              ) : (
                <BrainIcon
                  className={cn(
                    "size-4 transition-colors duration-200",
                    isOpen
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-neutral-600 dark:text-neutral-400"
                  )}
                />
              )}
            </div>

            <div className="flex flex-1 items-center gap-2">
              {isStreaming ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Thinking
                  </span>
                  <div className="flex gap-1">
                    <span className="size-1 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.3s] dark:bg-purple-400" />
                    <span className="size-1 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.15s] dark:bg-purple-400" />
                    <span className="size-1 animate-bounce rounded-full bg-purple-500 dark:bg-purple-400" />
                  </div>
                </div>
              ) : duration === 0 ? (
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {title}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Thought for
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {duration}s
                  </span>
                </div>
              )}
            </div>

            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 text-neutral-500 transition-all duration-300 dark:text-neutral-400",
                "group-hover/trigger:text-neutral-700 dark:group-hover/trigger:text-neutral-200",
                isOpen && "rotate-180 text-purple-600 dark:text-purple-400"
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <CollapsibleContent
      className={cn(
        "overflow-hidden transition-all duration-300",
        "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="border-t border-neutral-200/50 bg-gradient-to-br from-purple-50/30 to-transparent px-4 py-3 dark:border-neutral-800/50 dark:from-purple-900/10">
        <Response className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:text-neutral-700 dark:prose-p:text-neutral-300 max-w-none">
          {children}
        </Response>
      </div>
    </CollapsibleContent>
  )
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
