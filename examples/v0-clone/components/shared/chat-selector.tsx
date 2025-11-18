"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Users,
  Lock
} from "lucide-react";
import { IconMessage } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChats } from "@/queries/use-chats";
import { useChatsStore } from "./chat-selector.store";

interface Chat {
  id: string;
  name?: string;
  privacy?: "public" | "private" | "team" | "team-edit" | "unlisted";
  createdAt: string;
  url?: string;
}

// Helper function to get display name for a chat
const getChatDisplayName = (chat: Chat): string => {
  return chat.name || `Chat ${chat.id.slice(0, 8)}...`;
};

// Helper function to get privacy icon
const getPrivacyIcon = (privacy: string) => {
  switch (privacy) {
    case "public":
      return <Eye className="h-4 w-4" />;
    case "private":
      return <EyeOff className="h-4 w-4" />;
    case "team":
    case "team-edit":
      return <Users className="h-4 w-4" />;
    case "unlisted":
      return <Lock className="h-4 w-4" />;
    default:
      return <EyeOff className="h-4 w-4" />;
  }
};

// Helper function to get privacy display name
const getPrivacyDisplayName = (privacy: string) => {
  switch (privacy) {
    case "public":
      return "Public";
    case "private":
      return "Private";
    case "team":
      return "Team";
    case "team-edit":
      return "Team Edit";
    case "unlisted":
      return "Unlisted";
    default:
      return "Private";
  }
};

export function ChatSelector() {
  const router = useRouter();
  const pathname = usePathname();

  // Use the custom hook for fetching chats
  const { chats, isLoading } = useChats();

  // Use the store for updating chats
  const { updateChat, deleteChat: deleteChatFromStore } = useChatsStore();

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isVisibilityDialogOpen, setIsVisibilityDialogOpen] = useState(false);
  const [renameChatName, setRenameChatName] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState<
    "public" | "private" | "team" | "team-edit" | "unlisted"
  >("private");
  const [isRenamingChat, setIsRenamingChat] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [isDuplicatingChat, setIsDuplicatingChat] = useState(false);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);

  // Get current chat ID if on a chat page
  const currentChatId = pathname?.startsWith("/chats/")
    ? pathname.split("/")[2]
    : null;

  const handleValueChange = (chatId: string) => {
    router.push(`/chats/${chatId}`);
  };

  const handleRenameChat = async () => {
    if (!renameChatName.trim() || !currentChatId) {
      toast.warning("Please enter a valid chat name");
      return;
    }

    setIsRenamingChat(true);
    try {
      const response = await fetch(`/api/chats/${currentChatId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: renameChatName.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to rename chat");
      }

      const updatedChat = await response.json();

      // Update the chat in the store
      updateChat(currentChatId, { name: updatedChat.name });

      // Show success toast
      toast.success("Chat renamed successfully", {
        description: `Your chat has been renamed to "${updatedChat.name}"`
      });

      // Close dialog and reset form
      setIsRenameDialogOpen(false);
      setRenameChatName("");
    } catch (error) {
      console.error("Error renaming chat:", error);
      toast.error("Failed to rename chat", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsRenamingChat(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!currentChatId) return;

    setIsDeletingChat(true);
    try {
      const response = await fetch(`/api/chats/${currentChatId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to delete chat");
      }

      // Remove the chat from the store
      deleteChatFromStore(currentChatId);

      // Show success toast
      toast.success("Chat deleted", {
        description: "Your chat has been permanently deleted"
      });

      // Close dialog and navigate to home
      setIsDeleteDialogOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again."
      });

      // Keep dialog open on error so user can retry
    } finally {
      setIsDeletingChat(false);
    }
  };

  const handleDuplicateChat = async () => {
    if (!currentChatId) return;

    setIsDuplicatingChat(true);

    // Show loading toast
    const loadingToast = toast.loading("Duplicating chat...", {
      description: "This may take a moment"
    });

    try {
      const response = await fetch("/api/chat/fork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ chatId: currentChatId })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to duplicate chat");
      }

      const result = await response.json();

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Chat duplicated successfully", {
        description: "Redirecting to your new chat..."
      });

      // Close dialog and navigate to the new forked chat
      setIsDuplicateDialogOpen(false);

      // Small delay to show success message before navigation
      setTimeout(() => {
        router.push(`/chats/${result.id}`);
      }, 500);
    } catch (error) {
      console.error("Error duplicating chat:", error);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error("Failed to duplicate chat", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again."
      });

      // Keep dialog open on error so user can retry
    } finally {
      setIsDuplicatingChat(false);
    }
  };

  const handleChangeVisibility = async () => {
    if (!currentChatId) return;

    // Get current chat to check if visibility is actually changing
    const currentChat = chats.find((c) => c.id === currentChatId);
    if (currentChat && currentChat.privacy === selectedVisibility) {
      toast.info("No changes made", {
        description: `Chat is already set to ${getPrivacyDisplayName(selectedVisibility)}`
      });
      setIsVisibilityDialogOpen(false);
      return;
    }

    setIsChangingVisibility(true);
    try {
      const response = await fetch(`/api/chats/${currentChatId}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ privacy: selectedVisibility })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to change chat visibility");
      }

      const updatedChat = await response.json();

      // Update the chat in the store
      updateChat(currentChatId, { privacy: updatedChat.privacy });

      // Show success toast with privacy level
      toast.success("Visibility updated", {
        description: `Your chat is now ${getPrivacyDisplayName(updatedChat.privacy).toLowerCase()}`
      });

      // Close dialog
      setIsVisibilityDialogOpen(false);
    } catch (error) {
      console.error("Error changing chat visibility:", error);
      toast.error("Failed to update visibility", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again."
      });

      // Keep dialog open on error so user can retry
    } finally {
      setIsChangingVisibility(false);
    }
  };

  const handleOpenVisibilityDialog = () => {
    const currentChat = chats.find((c) => c.id === currentChatId);
    if (currentChat) {
      setSelectedVisibility(currentChat.privacy || "private");
    }
    setIsVisibilityDialogOpen(true);
  };

  // Find current chat
  const currentChat = chats.find((c) => c.id === currentChatId);

  return (
    <>
      <div className="flex w-full items-center gap-2">
        {isLoading ? (
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-white/5" />
        ) : chats.length === 0 ? (
          <div className="text-muted-foreground flex h-10 flex-1 items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm">
            <IconMessage className="h-4 w-4" />
            <span>No chats yet</span>
          </div>
        ) : (
          <Select value={currentChatId || ""} onValueChange={handleValueChange}>
            <SelectTrigger className="flex-1 border-white/10 bg-white/5 transition-colors hover:bg-white/8">
              <SelectValue placeholder="Select a chat">
                {currentChat ? (
                  <div className="flex items-center gap-2">
                    <IconMessage className="h-4 w-4" />
                    <span className="truncate">
                      {getChatDisplayName(currentChat)}
                    </span>
                    {currentChat.privacy && (
                      <span className="text-muted-foreground">
                        {getPrivacyIcon(currentChat.privacy)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span>Select a chat</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {chats.map((chat) => (
                <SelectItem key={chat.id} value={chat.id}>
                  <div className="flex items-center gap-2">
                    <IconMessage className="h-4 w-4" />
                    <span className="truncate">{getChatDisplayName(chat)}</span>
                    {chat.privacy && (
                      <span className="text-muted-foreground">
                        {getPrivacyIcon(chat.privacy)}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Chat Actions Dropdown */}
        {currentChat && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 border-white/10 bg-white/5 hover:bg-white/8"
                disabled={
                  isRenamingChat ||
                  isDeletingChat ||
                  isDuplicatingChat ||
                  isChangingVisibility
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleOpenVisibilityDialog}
                disabled={
                  isRenamingChat ||
                  isDeletingChat ||
                  isDuplicatingChat ||
                  isChangingVisibility
                }
              >
                {getPrivacyIcon(currentChat.privacy || "private")}
                <span className="ml-2">Change Visibility</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (currentChat.url) {
                    window.open(currentChat.url, "_blank");
                  }
                }}
                disabled={
                  !currentChat.url ||
                  isRenamingChat ||
                  isDeletingChat ||
                  isDuplicatingChat ||
                  isChangingVisibility
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDuplicateDialogOpen(true)}
                disabled={
                  isRenamingChat ||
                  isDeletingChat ||
                  isDuplicatingChat ||
                  isChangingVisibility
                }
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRenameChatName(currentChat.name || "");
                  setIsRenameDialogOpen(true);
                }}
                disabled={
                  isRenamingChat ||
                  isDeletingChat ||
                  isDuplicatingChat ||
                  isChangingVisibility
                }
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Rename Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={
                  isRenamingChat ||
                  isDeletingChat ||
                  isDuplicatingChat ||
                  isChangingVisibility
                }
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Rename Chat Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for this chat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Chat name"
              value={renameChatName}
              onChange={(e) => setRenameChatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRenamingChat) {
                  handleRenameChat();
                }
              }}
              disabled={isRenamingChat}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false);
                setRenameChatName("");
              }}
              disabled={isRenamingChat}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameChat}
              disabled={isRenamingChat || !renameChatName.trim()}
            >
              {isRenamingChat ? "Renaming..." : "Rename Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone and will permanently remove the chat and all its messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingChat}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChat}
              disabled={isDeletingChat}
              className="text-background bg-neutral-100 hover:bg-neutral-200"
            >
              {isDeletingChat ? "Deleting..." : "Delete Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Chat Dialog */}
      <Dialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Chat</DialogTitle>
            <DialogDescription>
              This will create a copy of the current chat. You'll be redirected
              to the new chat once it's created.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDuplicateDialogOpen(false)}
              disabled={isDuplicatingChat}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateChat}
              disabled={isDuplicatingChat}
              className="text-background bg-neutral-100 hover:bg-neutral-200"
            >
              {isDuplicatingChat ? "Duplicating..." : "Duplicate Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Visibility Dialog */}
      <Dialog
        open={isVisibilityDialogOpen}
        onOpenChange={setIsVisibilityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Chat Visibility</DialogTitle>
            <DialogDescription>
              Choose who can see and access this chat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedVisibility}
              onValueChange={(
                value: "public" | "private" | "team" | "team-edit" | "unlisted"
              ) => setSelectedVisibility(value)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getPrivacyIcon(selectedVisibility)}
                    <span>{getPrivacyDisplayName(selectedVisibility)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    <div>
                      <div>Private</div>
                      <div className="text-muted-foreground text-xs">
                        Only you can see this chat
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <div>Public</div>
                      <div className="text-muted-foreground text-xs">
                        Anyone can see this chat
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="team" disabled>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div>
                        Team{" "}
                        <span className="inline-flex !h-auto items-center-safe justify-center-safe rounded-full border bg-white/35 px-1.5 py-0.5 text-xs">
                          coming soon
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Team members can see this chat
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="team-edit" disabled>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div>
                        Team Edit{" "}
                        <span className="inline-flex !h-auto items-center-safe justify-center-safe rounded-full border bg-white/35 px-1.5 py-0.5 text-xs">
                          coming soon
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Team members can see and edit this chat
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVisibilityDialogOpen(false)}
              disabled={isChangingVisibility}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeVisibility}
              disabled={isChangingVisibility}
              className="text-background bg-neutral-100 hover:bg-neutral-200"
            >
              {isChangingVisibility ? "Changing..." : "Change Visibility"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
