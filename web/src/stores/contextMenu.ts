import { create } from "zustand";
import type { ContextMenuType } from "@/types/windows";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  data: unknown;
  menuKey: number;
  openAt: (x: number, y: number, menuType?: ContextMenuType, menuData?: unknown) => void;
  open: (event: React.MouseEvent, menuType?: ContextMenuType, menuData?: unknown) => void;
  close: () => void;
}

export const useContextMenuStore = create<ContextMenuState>()((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  type: "global",
  data: null,
  menuKey: 0,

  openAt: (x, y, menuType = "global", menuData = null) => {
    set({
      x,
      y,
      type: menuType,
      data: menuData,
      menuKey: Date.now(),
      isOpen: true,
    });
  },

  open: (event, menuType = "global", menuData = null) => {
    event.preventDefault();
    event.stopPropagation();

    set({
      x: event.clientX,
      y: event.clientY,
      type: menuType,
      data: menuData,
      menuKey: Date.now(),
      isOpen: true,
    });
  },

  close: () => {
    set({ isOpen: false });
  },
}));
