import { create } from "zustand";
import type { PostUser, PostMetrics, UserDetail, ChatMessage } from "@/types/models";
import type { RightViewType } from "@/types/windows";

interface Post {
  id: string;
  author: PostUser;
  createdAt: Date | string;
  content: string;
  metrics: PostMetrics;
}

interface SplitViewState {
  isOpen: boolean;
  currentPost: Post | null;
  currentUser: UserDetail | null;
  currentChat: ChatMessage | null;
  activeTab: string;
  profileTab: string;
  rightPanelWidth: number;
  isResizing: boolean;
  activeView: "left" | "right" | "widgets";
  currentRightViewType: RightViewType | null;
  currentBrowserUrl: string;
  isMaximized: boolean;
  refreshKey: number;
  widgetsPanelWidth: number;
  isWidgetsResizing: boolean;
  openPost: (post: Post) => void;
  openUser: (user: UserDetail) => void;
  openChat: (chat: ChatMessage) => void;
  openMusic: () => void;
  openBrowser: (url: string) => void;
  openNotifications: () => void;
  close: () => void;
  toggleMaximize: () => void;
  triggerRefresh: () => void;
  setTab: (tab: string) => void;
  setProfileTab: (tab: string) => void;
  setRightPanelWidth: (width: number) => void;
  focusLeft: () => void;
  focusRight: () => void;
  focusWidgets: () => void;
  setWidgetsPanelWidth: (width: number) => void;
}

export const useSplitViewStore = create<SplitViewState>()((set) => ({
  isOpen: false,
  currentPost: null,
  currentUser: null,
  currentChat: null,
  activeTab: "comments",
  profileTab: "home",
  rightPanelWidth: 50,
  isResizing: false,
  activeView: "left",
  currentRightViewType: null,
  currentBrowserUrl: "",
  isMaximized: false,
  refreshKey: 0,
  widgetsPanelWidth: 320,
  isWidgetsResizing: false,

  openPost: (post) =>
    set({
      currentPost: post,
      currentUser: null,
      currentChat: null,
      currentRightViewType: "post",
      isOpen: true,
      activeTab: "comments",
      activeView: "right",
      isMaximized: false,
      rightPanelWidth: 50,
    }),

  openUser: (user) =>
    set({
      currentUser: user,
      currentPost: null,
      currentChat: null,
      currentRightViewType: "user",
      isOpen: true,
      profileTab: "home",
      activeView: "right",
      isMaximized: false,
      rightPanelWidth: 50,
    }),

  openChat: (chat) =>
    set({
      currentChat: chat,
      currentPost: null,
      currentUser: null,
      currentRightViewType: "chat",
      isOpen: true,
      activeView: "right",
      isMaximized: false,
      rightPanelWidth: 45,
    }),

  openMusic: () =>
    set({
      currentPost: null,
      currentUser: null,
      currentChat: null,
      currentRightViewType: "music",
      isOpen: true,
      activeView: "right",
      isMaximized: false,
      rightPanelWidth: 38,
    }),

  openBrowser: (url) =>
    set({
      currentBrowserUrl: url,
      currentPost: null,
      currentUser: null,
      currentChat: null,
      currentRightViewType: "browser",
      isOpen: true,
      activeView: "right",
      isMaximized: false,
      rightPanelWidth: 60,
    }),

  openNotifications: () =>
    set({
      currentPost: null,
      currentUser: null,
      currentChat: null,
      currentRightViewType: "notifications",
      isOpen: true,
      activeView: "right",
      isMaximized: false,
      rightPanelWidth: 40,
    }),

  close: () =>
    set({
      isOpen: false,
      activeView: "left",
      currentRightViewType: null,
      isMaximized: false,
    }),

  toggleMaximize: () =>
    set((state) => ({
      isMaximized: !state.isMaximized,
    })),

  triggerRefresh: () =>
    set((state) => ({
      refreshKey: state.refreshKey + 1,
    })),

  setTab: (tab) => set({ activeTab: tab }),
  setProfileTab: (tab) => set({ profileTab: tab }),
  setRightPanelWidth: (width) =>
    set({ rightPanelWidth: Math.max(20, Math.min(80, width)) }),
  focusLeft: () => set({ activeView: "left" }),
  focusRight: () => set({ activeView: "right" }),
  focusWidgets: () => set({ activeView: "widgets" }),
  setWidgetsPanelWidth: (width) =>
    set({ widgetsPanelWidth: Math.max(240, Math.min(480, width)) }),
}));
