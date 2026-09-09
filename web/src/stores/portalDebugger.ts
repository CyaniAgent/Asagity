import { create } from "zustand";

export type PortalDebuggerTab = "react-lint" | "component-tree" | "performance";

interface PortalDebuggerState {
  isOpen: boolean;
  activeTab: PortalDebuggerTab;
  isEntryVisible: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setActiveTab: (tab: PortalDebuggerTab) => void;
  showEntry: () => void;
  hideEntry: () => void;
}

export const usePortalDebuggerStore = create<PortalDebuggerState>()((set) => ({
  isOpen: false,
  activeTab: "react-lint",
  isEntryVisible: process.env.NODE_ENV === "development",
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  showEntry: () => set({ isEntryVisible: true }),
  hideEntry: () => set({ isEntryVisible: false, isOpen: false }),
}));
