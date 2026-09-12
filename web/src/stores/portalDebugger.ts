import { create } from "zustand";
import type { RuntimeError } from "@/hooks/useRuntimeErrors";

/* ── Debug Command Log ─────────────────────────────────────── */
export interface DebugLog {
  id: string;
  command: string;
  args: string[];
  result: string;
  severity: "info" | "success" | "warning" | "error";
  timestamp: number;
}

/* ── Scanned Component ─────────────────────────────────────── */
export interface ScannedComponent {
  id: string;
  selector: string;
  label: string;
  tagName: string;
  visible: boolean;
}

/* ── Tab ───────────────────────────────────────────────────── */
export type PortalDebuggerTab = "problems" | "debug" | "hide-component";

/* ── State ─────────────────────────────────────────────────── */
interface PortalDebuggerState {
  isOpen: boolean;
  activeTab: PortalDebuggerTab;
  isEntryVisible: boolean;

  // Problems
  runtimeErrors: RuntimeError[];
  addRuntimeError: (error: RuntimeError) => void;
  clearRuntimeErrors: () => void;
  removeRuntimeError: (id: string) => void;

  // Debug
  debugLogs: DebugLog[];
  addDebugLog: (log: DebugLog) => void;
  clearDebugLogs: () => void;

  // Hide Component
  hiddenSelectors: string[];
  toggleComponentHide: (selector: string) => void;
  resetHiddenComponents: () => void;

  // Panel controls
  toggle: () => void;
  open: () => void;
  close: () => void;
  setActiveTab: (tab: PortalDebuggerTab) => void;
  showEntry: () => void;
  hideEntry: () => void;
}

export const usePortalDebuggerStore = create<PortalDebuggerState>()((set) => ({
  isOpen: false,
  activeTab: "problems",
  isEntryVisible: process.env.NODE_ENV === "development",

  // ── Problems ──
  runtimeErrors: [],
  addRuntimeError: (error) =>
    set((s) => {
      const isDuplicate = s.runtimeErrors.some(
        (e) =>
          e.message === error.message &&
          e.filename === error.filename &&
          e.type === error.type &&
          error.timestamp - e.timestamp < 5000
      );
      if (isDuplicate) return s;
      return { runtimeErrors: [error, ...s.runtimeErrors].slice(0, 100) };
    }),
  clearRuntimeErrors: () => set({ runtimeErrors: [] }),
  removeRuntimeError: (id) =>
    set((s) => ({ runtimeErrors: s.runtimeErrors.filter((e) => e.id !== id) })),

  // ── Debug ──
  debugLogs: [],
  addDebugLog: (log) =>
    set((s) => ({ debugLogs: [log, ...s.debugLogs].slice(0, 200) })),
  clearDebugLogs: () => set({ debugLogs: [] }),

  // ── Hide Component ──
  hiddenSelectors: [],
  toggleComponentHide: (selector) =>
    set((s) => {
      const exists = s.hiddenSelectors.includes(selector);
      return {
        hiddenSelectors: exists
          ? s.hiddenSelectors.filter((sel) => sel !== selector)
          : [...s.hiddenSelectors, selector],
      };
    }),
  resetHiddenComponents: () => set({ hiddenSelectors: [] }),

  // ── Panel ──
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  showEntry: () => set({ isEntryVisible: true }),
  hideEntry: () => set({ isEntryVisible: false, isOpen: false }),
}));
