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

interface Project {
  id: string;
  v0_project_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  instructions?: string | null;
  privacy: string;
  vercel_project_id?: string | null;
  created_at: string;
  updated_at: string;
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
  selectedProjectId: string | null;
  projects: Project[];
  envVarsValid: boolean;
  showEnvDialog: boolean;
  isAutoProvisioning: boolean; // NEW: Track auto-provisioning state
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
  setSelectedProjectId: (id: string | null) => void;
  setProjects: (projects: Project[]) => void;
  setEnvVarsValid: (valid: boolean) => void;
  setShowEnvDialog: (show: boolean) => void;
  setIsAutoProvisioning: (provisioning: boolean) => void; // NEW
  resetChatState: () => void;
}

interface ChatGetters {
  hasCurrentChatId: () => boolean;
  getCurrentChatId: () => string | null;
  getSelectedProject: () => Project | null;
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
  activePanel: "chat",
  selectedProjectId: null,
  projects: [],
  envVarsValid: false,
  showEnvDialog: false,
  isAutoProvisioning: false // NEW
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      clearCurrentChatId: () => set({ currentChatId: null }),
      getCurrentChatId: () => get().currentChatId,
      hasCurrentChatId: () => get().currentChatId !== null,

      setShowChatInterface: (show) => set({ showChatInterface: show }),

      setChatHistory: (history) => set({ chatHistory: history }),
      addChatMessage: (message) =>
        set((state) => ({ chatHistory: [...state.chatHistory, message] })),

      setCurrentChat: (chat) => set({ currentChat: chat }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

      setRefreshKey: (key) =>
        set((state) => ({
          refreshKey: typeof key === "function" ? key(state.refreshKey) : key
        })),

      setActivePanel: (panel) => set({ activePanel: panel }),

      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      setProjects: (projects) => set({ projects }),

      setEnvVarsValid: (valid) => set({ envVarsValid: valid }),

      setShowEnvDialog: (show) => set({ showEnvDialog: show }),

      setIsAutoProvisioning: (provisioning) =>
        set({ isAutoProvisioning: provisioning }), // NEW

      getSelectedProject: () => {
        const { selectedProjectId, projects } = get();
        if (!selectedProjectId) return null;
        return projects.find((p) => p.id === selectedProjectId) || null;
      },

      resetChatState: () => set(initialState)
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentChatId: state.currentChatId,
        showChatInterface: state.showChatInterface,
        currentChat: state.currentChat,
        isLoading: state.isLoading,
        isFullscreen: state.isFullscreen,
        refreshKey: state.refreshKey,
        activePanel: state.activePanel,
        selectedProjectId: state.selectedProjectId,
        projects: state.projects,
        envVarsValid: state.envVarsValid,
        isAutoProvisioning: state.isAutoProvisioning, // NEW: Persist this
        chatHistory: state.chatHistory.map((msg) => ({
          type: msg.type,
          content: msg.content,
          isStreaming: false,
          stream: null
        }))
      })
    }
  )
);
