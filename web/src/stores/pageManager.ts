import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PAGE_MENU, type PageMenuEntry } from "@/components/pagemanager/pageManagerConfig";

interface PageManagerState {
  menu: PageMenuEntry[];
  setMenu: (menu: PageMenuEntry[]) => void;
  resetMenu: () => void;
}

export const usePageManagerStore = create<PageManagerState>()(
  persist(
    (set) => ({
      menu: DEFAULT_PAGE_MENU,
      setMenu: (menu) => set({ menu }),
      resetMenu: () => set({ menu: DEFAULT_PAGE_MENU }),
    }),
    { name: "asagity-pagemanager" }
  )
);
