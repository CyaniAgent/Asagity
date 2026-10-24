import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_MENU_GROUPS,
  DEFAULT_STATUS_ITEMS,
  type WelcomeMenuGroupConfig,
  type WelcomeStatusItemConfig,
} from "@/components/welcome/welcomeConfig";

interface WelcomeState {
  menuGroups: WelcomeMenuGroupConfig[];
  statusItems: WelcomeStatusItemConfig[];
  setMenuGroups: (groups: WelcomeMenuGroupConfig[]) => void;
  setStatusItems: (items: WelcomeStatusItemConfig[]) => void;
  resetWelcome: () => void;
}

export const useWelcomeStore = create<WelcomeState>()(
  persist(
    (set) => ({
      menuGroups: DEFAULT_MENU_GROUPS,
      statusItems: DEFAULT_STATUS_ITEMS,
      setMenuGroups: (menuGroups) => set({ menuGroups }),
      setStatusItems: (statusItems) => set({ statusItems }),
      resetWelcome: () =>
        set({ menuGroups: DEFAULT_MENU_GROUPS, statusItems: DEFAULT_STATUS_ITEMS }),
    }),
    {
      name: "asagity-welcome",
      // Persist config only; live values (online count, backend flags)
      // are resolved at render time, never stored.
      partialize: (s) => ({ menuGroups: s.menuGroups, statusItems: s.statusItems }),
      // v1: timeline promoted out of the menu → force re-seed stale persisted configs
      version: 1,
      migrate: () => ({ menuGroups: DEFAULT_MENU_GROUPS, statusItems: DEFAULT_STATUS_ITEMS }),
    }
  )
);
