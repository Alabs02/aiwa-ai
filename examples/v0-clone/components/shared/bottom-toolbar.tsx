"use client";

import { MessageSquare, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomToolbarProps {
  activePanel: "chat" | "preview";
  onPanelChange: (panel: "chat" | "preview") => void;
  hasPreview: boolean;
}

export function BottomToolbar({
  activePanel,
  onPanelChange,
  hasPreview
}: BottomToolbarProps) {
  return (
    <div className="bg-white px-2 py-4 dark:bg-black">
      <div className="mx-auto flex max-w-xs items-center justify-center">
        <div className="bg-secondary flex w-full rounded-lg p-1">
          <button
            onClick={() => onPanelChange("chat")}
            className={cn(
              "flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-xs font-medium transition-all duration-200",
              activePanel === "chat"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3 w-3" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onPanelChange("preview")}
            disabled={!hasPreview}
            className={cn(
              "flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-xs font-medium transition-all duration-200",
              activePanel === "preview"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
              !hasPreview &&
                "hover:text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            <Monitor className="h-3 w-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
