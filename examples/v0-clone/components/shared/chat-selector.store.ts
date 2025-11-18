import { create } from "zustand";

interface Chat {
  id: string;
  name?: string;
  privacy?: "public" | "private" | "team" | "team-edit" | "unlisted";
  createdAt: string;
  url?: string;
}

interface ChatStore {
  // State
  chats: Chat[];
  isLoading: boolean;

  // Actions
  setChats: (chats: Chat[]) => void;
  setIsLoading: (loading: boolean) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  deleteChat: (chatId: string) => void;
  resetChats: () => void;
}

export const useChatsStore = create<ChatStore>((set) => ({
  // Initial state
  chats: [],
  isLoading: false,

  // Actions
  setChats: (chats) => set({ chats }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats]
    })),

  updateChat: (chatId, updates) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      )
    })),

  deleteChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== chatId)
    })),

  resetChats: () => set({ chats: [], isLoading: false })
}));
