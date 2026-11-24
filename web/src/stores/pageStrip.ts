import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidthPreset = "1/3" | "1/2" | "2/3" | "fixed";

export interface TabView {
  kind: "route" | "split" | "window";
  /** route → 路径；split/window → ViewType */
  refId: string;
  /** browser 窗口转 tab 时保留目标 URL */
  browserUrl?: string;
}

export interface PageTab {
  id: string;
  appId: string;
  icon: string;
  titleKey?: string;
  title?: string;
  width: WidthPreset;
  fixedWidth?: number;
  /** 自适应宽度默认开启（Misskey flexible 语义，width 作为 min-width） */
  autoWidth: boolean;
  minimized: boolean;
  history: { stack: string[]; index: number };
  view: TabView;
}

export interface PageColumn {
  id: string;
  display: "stack" | "tabbed";
  tabs: PageTab[];
  activeTabId: string | null;
}

export interface OpenTabInput {
  appId: string;
  icon: string;
  titleKey?: string;
  title?: string;
  view: TabView;
}

interface PageStripState {
  columns: PageColumn[];
  activeColumnId: string | null;
  activeTabId: string | null;
  flashTabId: string | null;
  openTab: (input: OpenTabInput) => string;
  activateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  toggleMinimize: (tabId: string) => void;
  setWidth: (tabId: string, width: WidthPreset, fixedWidth?: number) => void;
  setAutoWidth: (tabId: string, value: boolean) => void;
  back: (tabId: string) => void;
  forward: (tabId: string) => void;
  setColumnDisplay: (columnId: string, display: "stack" | "tabbed") => void;
  flashTab: (tabId: string) => void;
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function makeTab(input: OpenTabInput): PageTab {
  return {
    id: uid(),
    ...input,
    width: "1/3",
    autoWidth: true,
    minimized: false,
    history: { stack: [input.view.refId], index: 0 },
  };
}

const INITIAL_TAB = makeTab({
  appId: "home",
  icon: "home",
  titleKey: "tabs.home",
  view: { kind: "route", refId: "/" },
});

let flashTimer: ReturnType<typeof setTimeout> | null = null;

export const usePageStripStore = create<PageStripState>()(
  persist(
    (set, get) => ({
      columns: [{ id: "col-1", display: "stack", tabs: [INITIAL_TAB], activeTabId: INITIAL_TAB.id }],
      activeColumnId: "col-1",
      activeTabId: INITIAL_TAB.id,
      flashTabId: null,

      openTab: (input) => {
        const state = get();
        // 同一目标复用已有 tab：只激活，不重复开页
        for (const column of state.columns) {
          const existing = column.tabs.find((t) => t.view.kind === input.view.kind && t.view.refId === input.view.refId);
          if (existing) {
            set({
              activeTabId: existing.id,
              activeColumnId: column.id,
              columns: state.columns.map((c) =>
                c.id === column.id
                  ? { ...c, activeTabId: existing.id, tabs: c.tabs.map((t) => (t.id === existing.id ? { ...t, minimized: false } : t)) }
                  : c),
            });
            return existing.id;
          }
        }
        const tab = makeTab(input);
        const column: PageColumn = { id: uid(), display: "stack", tabs: [tab], activeTabId: tab.id };
        set({
          activeTabId: tab.id,
          activeColumnId: column.id,
          columns: [...state.columns, column],
        });
        return tab.id;
      },

      activateTab: (tabId) => {
        const state = get();
        set({
          activeTabId: tabId,
          columns: state.columns.map((c) => ({
            ...c,
            activeTabId: c.tabs.some((t) => t.id === tabId) ? tabId : c.activeTabId,
            tabs: c.tabs.map((t) => (t.id === tabId ? { ...t, minimized: false } : t)),
          })),
        });
      },

      closeTab: (tabId) => {
        const state = get();
        const columns = state.columns
          .map((c) => {
            const tabs = c.tabs.filter((t) => t.id !== tabId);
            return { ...c, tabs, activeTabId: c.activeTabId === tabId ? tabs[0]?.id ?? null : c.activeTabId };
          })
          .filter((c) => c.tabs.length > 0);
        const next = columns[0] ?? null;
        set({
          columns: next ? columns : [{ id: "col-1", display: "stack", tabs: [], activeTabId: null }],
          activeColumnId: next?.id ?? (columns.length ? columns[0].id : "col-1"),
          activeTabId: next?.activeTabId ?? null,
        });
      },

      toggleMinimize: (tabId) => {
        set((state) => ({
          columns: state.columns.map((c) => ({
            ...c,
            tabs: c.tabs.map((t) => (t.id === tabId ? { ...t, minimized: !t.minimized } : t)),
          })),
        }));
      },

      setWidth: (tabId, width, fixedWidth) => {
        set((state) => ({
          columns: state.columns.map((c) => ({
            ...c,
            tabs: c.tabs.map((t) => (t.id === tabId ? { ...t, width, fixedWidth } : t)),
          })),
        }));
      },

      setAutoWidth: (tabId, value) => {
        set((state) => ({
          columns: state.columns.map((c) => ({
            ...c,
            tabs: c.tabs.map((t) => (t.id === tabId ? { ...t, autoWidth: value } : t)),
          })),
        }));
      },

      back: (tabId) => {
        set((state) => ({
          columns: state.columns.map((c) => ({
            ...c,
            tabs: c.tabs.map((t) => {
              if (t.id !== tabId || t.history.index <= 0) return t;
              return { ...t, history: { ...t.history, index: t.history.index - 1 } };
            }),
          })),
        }));
      },

      forward: (tabId) => {
        set((state) => ({
          columns: state.columns.map((c) => ({
            ...c,
            tabs: c.tabs.map((t) => {
              if (t.id !== tabId || t.history.index >= t.history.stack.length - 1) return t;
              return { ...t, history: { ...t.history, index: t.history.index + 1 } };
            }),
          })),
        }));
      },

      setColumnDisplay: (columnId, display) => {
        set((state) => ({
          columns: state.columns.map((c) => (c.id === columnId ? { ...c, display } : c)),
        }));
      },

      flashTab: (tabId) => {
        set({ flashTabId: tabId });
        if (flashTimer) clearTimeout(flashTimer);
        flashTimer = setTimeout(() => set({ flashTabId: null }), 3000);
      },
    }),
    { name: "asagity-page-strip", version: 1 },
  ),
);
