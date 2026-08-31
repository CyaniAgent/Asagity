import { create } from "zustand";
import { useUserStore } from "@/stores/user";
import type { ViewType } from "@/types/windows";

/** Unique window instance. */
export interface Window {
  id: string;
  viewType: ViewType;
  /** Browser iframe URL */
  browserUrl?: string;
  /** Error data */
  errorData?: { title: string; message: string; code: string; silent: boolean };
  /** Per-window refresh counter */
  refreshKey: number;
  /** Auto-minimized by memory manager */
  isMinimized: boolean;
  /** Unix-ms timestamp for LRU eviction */
  lastFocusedAt: number;
}

/* ------------------------------------------------------------------ */

let nextId = 1;
const uid = () => String(nextId++);

/** Singleton types — only one instance allowed at a time. */
const SINGLETONS: ViewType[] = ["termity", "auth", "lyrics_window", "playlist_window"];

function makeWindow(viewType: ViewType, extra?: Pick<Window, "browserUrl" | "errorData">): Window {
  return {
    id: uid(),
    viewType,
    browserUrl: extra?.browserUrl,
    errorData: extra?.errorData,
    refreshKey: 0,
    isMinimized: false,
    lastFocusedAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */

interface FreeWindowState {
  /** All open windows */
  windows: Window[];
  /** ID of the most-recently-focused window */
  focusedId: string | null;
  /** Termity auth modal (global) */
  isTermityAuthOpen: boolean;

  // ── Actions ──────────────────────────────────────────────────────
  openFromContext: (
    viewType: ViewType,
    data?: { browserUrl?: string; errorData?: Window["errorData"] },
  ) => string;
  openTermity: () => void;
  confirmTermityAuth: () => void;
  closeTermityAuth: () => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimizeOldest: (ids: string[]) => void;
  triggerRefresh: (id: string) => void;
}

export const useFreeWindowStore = create<FreeWindowState>()((set, get) => ({
  windows: [],
  focusedId: null,
  isTermityAuthOpen: false,

  /* ── Open ──────────────────────────────────────────────────────── */
  openFromContext: (viewType, data) => {
    const state = get();

    // Singleton guard: if one already exists, focus it and return its id
    if (SINGLETONS.includes(viewType)) {
      const existing = state.windows.find((w) => w.viewType === viewType);
      if (existing) {
        set({
          focusedId: existing.id,
          windows: state.windows.map((w) =>
            w.id === existing.id ? { ...w, lastFocusedAt: Date.now(), isMinimized: false } : w,
          ),
        });
        return existing.id;
      }
    }

    const win = makeWindow(viewType, data);
    set({
      windows: [...state.windows, win],
      focusedId: win.id,
    });
    return win.id;
  },

  openTermity: () => {
    const { isLoggedIn } = useUserStore.getState();
    if (isLoggedIn) {
      get().openFromContext("termity");
    } else {
      set({ isTermityAuthOpen: true });
    }
  },

  confirmTermityAuth: () => {
    set({ isTermityAuthOpen: false });
    get().openFromContext("termity");
  },

  closeTermityAuth: () => set({ isTermityAuthOpen: false }),

  /* ── Close ─────────────────────────────────────────────────────── */
  close: (id) =>
    set((state) => {
      const next = state.windows.filter((w) => w.id !== id);
      return {
        windows: next,
        focusedId:
          state.focusedId === id
            ? (next.length > 0 ? next[next.length - 1].id : null)
            : state.focusedId,
      };
    }),

  /* ── Focus ─────────────────────────────────────────────────────── */
  focus: (id) =>
    set((state) => ({
      focusedId: id,
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, lastFocusedAt: Date.now(), isMinimized: false } : w,
      ),
    })),

  /* ── Memory manager ────────────────────────────────────────────── */
  minimizeOldest: (ids) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        ids.includes(w.id) ? { ...w, isMinimized: true } : w,
      ),
    })),

  /* ── Refresh ───────────────────────────────────────────────────── */
  triggerRefresh: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, refreshKey: w.refreshKey + 1 } : w,
      ),
    })),
}));
