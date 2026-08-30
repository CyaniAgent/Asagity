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
  isTermityAuthOpen: boolean;
  refreshKey: number;
  openFromContext: (type: ViewType, data: { post?: Post | null; user?: UserDetail | null; chat?: ChatMessage | null }, tabs?: { activeTab?: string; profileTab?: string }) => void;
  openBrowser: (url: string) => void;
  openError: (title: string, message: string, code?: string, silent?: boolean) => void;
  openTermity: () => void;
  confirmTermityAuth: () => void;
  closeTermityAuth: () => void;
  openLyrics: () => void;
  openPlaylist: () => void;
  close: () => void;
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
  isTermityAuthOpen: false,
  refreshKey: 0,

  openFromContext: (type, data, tabs = {}) =>
    set({
      currentViewType: type,
      currentPost: data.post || null,
      currentUser: data.user || null,
      currentChat: data.chat || null,
      activeTab: tabs.activeTab || "comments",
      profileTab: tabs.profileTab || "home",
      isOpen: true,
    }),

  openBrowser: (url) =>
    set({
      currentBrowserUrl: url,
      currentViewType: "browser",
      isOpen: true,
    }),

  openError: (title, message, code = "", silent = false) =>
    set({
      errorData: { title, message, code, silent },
      currentViewType: "error",
      isOpen: true,
    }),

  openTermity: () => {
    const { isLoggedIn } = useUserStore.getState();
    if (isLoggedIn) {
      set({
        currentViewType: "termity",
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
      isOpen: true,
    }),

  closeTermityAuth: () =>
    set({ isTermityAuthOpen: false }),

  openLyrics: () =>
    set({
      currentViewType: "lyrics_window",
      isOpen: true,
    }),

  openPlaylist: () =>
    set({
      currentViewType: "playlist_window",
      isOpen: true,
    }),

  close: () =>
    set({
      isOpen: false,
      currentPost: null,
      currentUser: null,
      currentChat: null,
      currentBrowserUrl: "",
    }),

  triggerRefresh: () =>
    set((state) => ({
      refreshKey: state.refreshKey + 1,
    })),

  setTab: (tab) => set({ activeTab: tab }),
  setProfileTab: (tab) => set({ profileTab: tab }),
}));
