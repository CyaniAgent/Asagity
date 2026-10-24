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
/** 桌面双栏布局下左栏的子 Tab（右栏固定为 Debug） */
export type PortalDebuggerLeftTab = "problems" | "hide-component";

/* ── State ─────────────────────────────────────────────────── */
interface PortalDebuggerState {
  activeTab: PortalDebuggerTab;
  leftTab: PortalDebuggerLeftTab;
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
  setActiveTab: (tab: PortalDebuggerTab) => void;
  setLeftTab: (tab: PortalDebuggerLeftTab) => void;
  showEntry: () => void;
  hideEntry: () => void;
}

export const usePortalDebuggerStore = create<PortalDebuggerState>()((set) => ({
  activeTab: "problems",
  leftTab: "problems",
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
      // 熔断：永不允许隐藏 body/html（旧存档 body.min-h-full.flex 等）
      const lowered = selector.trim().toLowerCase();
      const isProtected =
        lowered === "body" ||
        lowered === "html" ||
        lowered.startsWith("body.") ||
        lowered.startsWith("body:") ||
        lowered.startsWith("body[") ||
        lowered.startsWith("html.") ||
        lowered.startsWith("html:") ||
        lowered.startsWith("html[");
      if (isProtected) return s;
      const exists = s.hiddenSelectors.includes(selector);
      return {
        hiddenSelectors: exists
          ? s.hiddenSelectors.filter((sel) => sel !== selector)
          : [...s.hiddenSelectors, selector],
      };
    }),
  resetHiddenComponents: () => set({ hiddenSelectors: [] }),

  // ── Panel ──
  // activeTab 保留做兼容：切到 problems/hide-component 时同步 leftTab
  setActiveTab: (tab) =>
    set((s) => ({
      activeTab: tab,
      leftTab: tab === "debug" ? s.leftTab : tab,
    })),
  setLeftTab: (tab) => set({ leftTab: tab, activeTab: tab }),
  showEntry: () => set({ isEntryVisible: true }),
  hideEntry: () => set({ isEntryVisible: false }),
}));
