import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ChatMessage {
  type: "user" | "assistant";
  content: string | any;
  isStreaming?: boolean;
  stream?: ReadableStream<Uint8Array> | null;
}

interface CurrentChat {
  id: string;
  demo?: string;
}

interface ChatState {
  currentChatId: string | null;
  showChatInterface: boolean;
  chatHistory: ChatMessage[];
  currentChat: CurrentChat | null;
  isLoading: boolean;
  isFullscreen: boolean;
  refreshKey: number;
  activePanel: "chat" | "preview";
}

interface ChatActions {
  setCurrentChatId: (chatId: string | null) => void;
  clearCurrentChatId: () => void;
  setShowChatInterface: (show: boolean) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setCurrentChat: (chat: CurrentChat | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setRefreshKey: (key: number | ((prev: number) => number)) => void;
  setActivePanel: (panel: "chat" | "preview") => void;
  resetChatState: () => void;
}

interface ChatGetters {
  hasCurrentChatId: () => boolean;
  getCurrentChatId: () => string | null;
}

type ChatStore = ChatState & ChatActions & ChatGetters;

const initialState: ChatState = {
  currentChatId: null,
  showChatInterface: false,
  chatHistory: [],
  currentChat: null,
  isLoading: false,
  isFullscreen: false,
  refreshKey: 0,
  activePanel: "chat"
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Chat ID management
      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      clearCurrentChatId: () => set({ currentChatId: null }),
      getCurrentChatId: () => get().currentChatId,
      hasCurrentChatId: () => get().currentChatId !== null,

      // Chat interface management
      setShowChatInterface: (show) => set({ showChatInterface: show }),

      // Chat history management
      setChatHistory: (history) => set({ chatHistory: history }),
      addChatMessage: (message) =>
        set((state) => ({ chatHistory: [...state.chatHistory, message] })),

      // Current chat management
      setCurrentChat: (chat) => set({ currentChat: chat }),

      // Loading state
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Fullscreen state
      setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

      // Refresh key
      setRefreshKey: (key) =>
        set((state) => ({
          refreshKey: typeof key === "function" ? key(state.refreshKey) : key
        })),

      // Active panel
      setActivePanel: (panel) => set({ activePanel: panel }),

      // Reset all chat state
      resetChatState: () => set(initialState)
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist critical state, not streams
      partialize: (state) => ({
        currentChatId: state.currentChatId,
        showChatInterface: state.showChatInterface,
        currentChat: state.currentChat,
        isFullscreen: state.isFullscreen,
        refreshKey: state.refreshKey,
        activePanel: state.activePanel,
        // Don't persist chatHistory with streams
        chatHistory: state.chatHistory.map((msg) => ({
          type: msg.type,
          content: msg.content,
          isStreaming: false, // Reset streaming state on persistence
          stream: null // Don't persist streams
        }))
      })
    }
  )
);
