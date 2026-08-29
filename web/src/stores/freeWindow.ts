import { create } from "zustand";
import { useUserStore } from "@/stores/user";
import type { PostUser, PostMetrics, UserDetail, ChatMessage } from "@/types/models";
import type { ViewType } from "@/types/windows";

interface Post {
  id: string;
  author: PostUser;
  createdAt: Date | string;
  content: string;
  metrics: PostMetrics;
}

interface ErrorData {
  title: string;
  message: string;
  code: string;
  silent: boolean;
}

interface FreeWindowState {
  isOpen: boolean;
  currentPost: Post | null;
  currentUser: UserDetail | null;
  currentChat: ChatMessage | null;
  currentBrowserUrl: string;
  errorData: ErrorData;
  activeTab: string;
  profileTab: string;
  currentViewType: ViewType | null;
  isMaximized: boolean;
  isMinimized: boolean;
  isTermityAuthOpen: boolean;
  refreshKey: number;
  position: { x: number; y: number };
  openFromContext: (type: ViewType, data: { post?: Post | null; user?: UserDetail | null; chat?: ChatMessage | null }, tabs?: { activeTab?: string; profileTab?: string }) => void;
  openBrowser: (url: string) => void;
  openError: (title: string, message: string, code?: string, silent?: boolean) => void;
  openTermity: () => void;
  confirmTermityAuth: () => void;
  closeTermityAuth: () => void;
  openLyrics: () => void;
  openPlaylist: () => void;
  close: () => void;
  toggleMaximize: () => void;
  toggleMinimize: () => void;
  triggerRefresh: () => void;
  setTab: (tab: string) => void;
  setProfileTab: (tab: string) => void;
}

export const useFreeWindowStore = create<FreeWindowState>()((set) => ({
  isOpen: false,
  currentPost: null,
  currentUser: null,
  currentChat: null,
  currentBrowserUrl: "",
  errorData: { title: "", message: "", code: "", silent: false },
  activeTab: "comments",
  profileTab: "home",
  currentViewType: null,
  isMaximized: false,
  isMinimized: false,
  isTermityAuthOpen: false,
  refreshKey: 0,
  position: {
    x: typeof window !== "undefined" ? window.innerWidth / 2 - 200 : 100,
    y: 100,
  },

  openFromContext: (type, data, tabs = {}) =>
    set({
      currentViewType: type,
      currentPost: data.post || null,
      currentUser: data.user || null,
      currentChat: data.chat || null,
      activeTab: tabs.activeTab || "comments",
      profileTab: tabs.profileTab || "home",
      isMinimized: false,
      isOpen: true,
    }),

  openBrowser: (url) =>
    set({
      currentBrowserUrl: url,
      currentViewType: "browser",
      isMinimized: false,
      isOpen: true,
    }),

  openError: (title, message, code = "", silent = false) =>
    set({
      errorData: { title, message, code, silent },
      currentViewType: "error",
      isMinimized: false,
      isOpen: true,
    }),

  openTermity: () => {
    const { isLoggedIn } = useUserStore.getState();
    if (isLoggedIn) {
      set({
        currentViewType: "termity",
        isMinimized: false,
        isOpen: true,
      });
    } else {
      set({ isTermityAuthOpen: true });
    }
  },

  confirmTermityAuth: () =>
    set({
      isTermityAuthOpen: false,
      currentViewType: "termity",
      isMinimized: false,
      isOpen: true,
    }),

  closeTermityAuth: () =>
    set({ isTermityAuthOpen: false }),

  openLyrics: () =>
    set({
      currentViewType: "lyrics_window",
      isMinimized: false,
      isOpen: true,
    }),

  openPlaylist: () =>
    set({
      currentViewType: "playlist_window",
      isMinimized: false,
      isOpen: true,
    }),

  close: () =>
    set({
      isOpen: false,
      isMaximized: false,
      isMinimized: false,
      currentPost: null,
      currentUser: null,
      currentChat: null,
      currentBrowserUrl: "",
    }),

  toggleMaximize: () =>
    set((state) => ({
      isMaximized: !state.isMaximized,
      isMinimized: state.isMaximized ? state.isMinimized : false,
    })),

  toggleMinimize: () =>
    set((state) => ({
      isMinimized: !state.isMinimized,
      isMaximized: state.isMinimized ? state.isMaximized : false,
    })),

  triggerRefresh: () =>
    set((state) => ({
      refreshKey: state.refreshKey + 1,
    })),

  setTab: (tab) => set({ activeTab: tab }),
  setProfileTab: (tab) => set({ profileTab: tab }),
}));
