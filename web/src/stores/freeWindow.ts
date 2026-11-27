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
const SINGLETONS: ViewType[] = ["termity", "auth", "login_window", "register_window", "lyrics_window", "playlist_window", "portal_debugger", "system_info"];

/**
 * 登录 ⇄ 注册 的就地切换时序。三段：
 *   0 ── AUTH_FORM_OUT_MS        旧表单沿自己一侧整槽滑出窗口（楔形同时开始滑向对侧）
 *   AUTH_FORM_OUT_MS ── +260ms   新表单淡入落位（接缝藏在"完全划出"之后）
 *   0 ── AUTH_SWEEP_MS           楔形 + 品牌块从一侧滑到另一侧
 * AUTH_SWEEP_MS 必须与 globals.css 的 --auth-sweep-dur 保持一致；
 * AUTH_FORM_OUT_MS 同时是表单滑出的 transition 时长（AuthShell 引用同一常量）。
 */
export const AUTH_FORM_OUT_MS = 300;
export const AUTH_SWEEP_MS = 620;

/**
 * 登录 / 注册窗口关闭退场：表单与品牌楔形沿各自一侧向外分离飞出，
 * 外壳同步渐隐，动画走完才真正移除窗口。
 * AUTH_EXIT_MS 必须与 globals.css 的 --auth-exit-dur 保持一致。
 */
export const AUTH_EXIT_MS = 420;

export interface AuthSwitchState {
  id: string;
  to: ViewType;
  /** out = 旧内容正在淡出；in = 新内容已挂载，正在淡入 */
  phase: "out" | "in";
}

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
  /** Auth modal (login / register) */
  isAuthOpen: boolean;
  /** 正在进行中的登录 ⇄ 注册 切换（同一时刻只允许一个） */
  switchingWindow: AuthSwitchState | null;
  /** 正在做关闭退场动画的登录 / 注册窗口 id（分离动画走完后才移除） */
  closingWindow: string | null;

  // ── Actions ──────────────────────────────────────────────────────
  openFromContext: (
    viewType: ViewType,
    data?: { browserUrl?: string; errorData?: Window["errorData"] },
  ) => string;
  /**
   * 就地切换某个窗口的内容类型，窗口本身（id、位置、尺寸）保持不变。
   * 登录 ⇄ 注册 走这条路，避免「关一个再开一个」造成的重新打开观感。
   */
  switchView: (id: string, viewType: ViewType) => void;
  openTermity: () => void;
  confirmTermityAuth: () => void;
  closeTermityAuth: () => void;
  openAuth: () => void;
  closeAuth: () => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimizeOldest: (ids: string[]) => void;
  /** 单窗最小化 / 恢复（运行管理器用；恢复与 focus 等价） */
  setMinimized: (id: string, v: boolean) => void;
  triggerRefresh: (id: string) => void;
}

export const useFreeWindowStore = create<FreeWindowState>()((set, get) => ({
  windows: [],
  focusedId: null,
  isTermityAuthOpen: false,
  isAuthOpen: false,
  switchingWindow: null,
  closingWindow: null,

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

  switchView: (id, viewType) => {
    const win = get().windows.find((w) => w.id === id);
    if (!win || win.viewType === viewType) return;
    // 上一次切换还没走完就再点一次会叠出两套计时器，直接忽略。
    if (get().switchingWindow) return;
    // 窗口正在做关闭退场动画时内容即将消失，切换没有意义。
    if (get().closingWindow) return;

    set({ switchingWindow: { id, to: viewType, phase: "out" } });

    // 旧表单完全划出窗口后再换内容，接缝藏在窗口边界之外。
    setTimeout(() => {
      set((state) => ({
        switchingWindow: state.switchingWindow
          ? { ...state.switchingWindow, phase: "in" as const }
          : null,
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, viewType, refreshKey: w.refreshKey + 1 } : w,
        ),
      }));
    }, AUTH_FORM_OUT_MS);

    // 楔形滑完再清标记，留一点余量给淡入收尾。
    setTimeout(() => {
      set({ switchingWindow: null });
    }, AUTH_SWEEP_MS + 80);
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

  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),

  /* ── Close ─────────────────────────────────────────────────────── */
  close: (id) => {
    const win = get().windows.find((w) => w.id === id);
    const isAuthWindow =
      win?.viewType === "login_window" || win?.viewType === "register_window";

    // 登录 / 注册窗口：先让表单与楔形做分离退场，动画走完再移除窗口。
    // 动画期间的重复调用（连点 ×、登录成功与点 × 竞态）幂等忽略。
    if (isAuthWindow) {
      if (get().closingWindow) return;
      set({ closingWindow: id });
      setTimeout(() => {
        set((state) => {
          const next = state.windows.filter((w) => w.id !== id);
          return {
            windows: next,
            focusedId:
              state.focusedId === id
                ? (next.length > 0 ? next[next.length - 1].id : null)
                : state.focusedId,
            closingWindow: null,
          };
        });
      }, AUTH_EXIT_MS);
      return;
    }

    set((state) => {
      const next = state.windows.filter((w) => w.id !== id);
      return {
        windows: next,
        focusedId:
          state.focusedId === id
            ? (next.length > 0 ? next[next.length - 1].id : null)
            : state.focusedId,
      };
    });
  },

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

  /* ── Single-window minimize / restore ──────────────────────────── */
  setMinimized: (id, v) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, isMinimized: v, lastFocusedAt: v ? w.lastFocusedAt : Date.now() }
          : w,
      ),
      focusedId: v ? state.focusedId : id,
    })),

  /* ── Refresh ───────────────────────────────────────────────────── */
  triggerRefresh: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, refreshKey: w.refreshKey + 1 } : w,
      ),
    })),
}));
