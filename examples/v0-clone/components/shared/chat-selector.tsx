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
    if (!renameChatName.trim() || !currentChatId) return;

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
        throw new Error("Failed to rename chat");
      }

      const updatedChat = await response.json();

      // Update the chat in the store
      updateChat(currentChatId, { name: updatedChat.name });

      // Close dialog and reset form
      setIsRenameDialogOpen(false);
      setRenameChatName("");
    } catch (error) {
      console.error("Error renaming chat:", error);
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
        throw new Error("Failed to delete chat");
      }

      // Remove the chat from the store
      deleteChatFromStore(currentChatId);

      // Close dialog and navigate to home
      setIsDeleteDialogOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeletingChat(false);
    }
  };

  const handleDuplicateChat = async () => {
    if (!currentChatId) return;

    setIsDuplicatingChat(true);
    try {
      const response = await fetch("/api/chat/fork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ chatId: currentChatId })
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate chat");
      }

      const result = await response.json();

      // Close dialog and navigate to the new forked chat
      setIsDuplicateDialogOpen(false);
      router.push(`/chats/${result.id}`);
    } catch (error) {
      console.error("Error duplicating chat:", error);
    } finally {
      setIsDuplicatingChat(false);
    }
  };

  const handleChangeVisibility = async () => {
    if (!currentChatId) return;

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
        throw new Error("Failed to change chat visibility");
      }

      const updatedChat = await response.json();

      // Update the chat in the store
      updateChat(currentChatId, { privacy: updatedChat.privacy });

      // Close dialog
      setIsVisibilityDialogOpen(false);
    } catch (error) {
      console.error("Error changing chat visibility:", error);
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
        <Select
          value={currentChatId || ""}
          onValueChange={handleValueChange}
          disabled={isLoading}
        >
          <SelectTrigger className="h-9 w-full border-white/8 bg-white/3 hover:bg-white/5 focus:bg-white/8 focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Select a chat">
              {currentChat ? (
                <div className="flex items-center gap-2">
                  <IconMessage className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{getChatDisplayName(currentChat)}</span>
                  {currentChat.privacy &&
                    currentChat.privacy !== "private" && (
                      <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
                        {getPrivacyIcon(currentChat.privacy)}
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconMessage className="h-4 w-4" />
                  <span>Select a chat</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {chats.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {isLoading ? "Loading chats..." : "No chats yet"}
              </div>
            ) : (
              chats.map((chat) => (
                <SelectItem key={chat.id} value={chat.id}>
                  <div className="flex items-center gap-2">
                    <IconMessage className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{getChatDisplayName(chat)}</span>
                    {chat.privacy && chat.privacy !== "private" && (
                      <div className="ml-auto flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
                        {getPrivacyIcon(chat.privacy)}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {currentChatId && currentChat && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 border-white/8 bg-white/3 hover:bg-white/5"
                disabled={
                  isRenamingChat ||
                  isDeletingChat ||
                  isDuplicatingChat ||
                  isChangingVisibility
                }
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
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
              {currentChat.url && (
                <DropdownMenuItem
                  onClick={() => window.open(currentChat.url, "_blank")}
                  disabled={
                    isRenamingChat ||
                    isDeletingChat ||
                    isDuplicatingChat ||
                    isChangingVisibility
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </DropdownMenuItem>
              )}
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
              className="bg-neutral-100 hover:bg-neutral-200 text-background"
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
            <Button onClick={handleDuplicateChat} disabled={isDuplicatingChat} className="bg-neutral-100 hover:bg-neutral-200 text-background">
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
              className="bg-neutral-100 hover:bg-neutral-200 text-background"
            >
              {isChangingVisibility ? "Changing..." : "Change Visibility"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}