/**
 * 自研客户端路由 Store
 *
 * 替代 next/navigation 的 useRouter / usePathname / useSearchParams。
 * 基于 Zustand + History API，完全在客户端运行。
 *
 * - push(path)   — 导航到新路径（压入历史）
 * - replace(path) — 替换当前路径（不压入历史）
 * - back()       — 后退
 * - forward()    — 前进
 * - currentPath  — 当前路径（不含 query）
 * - currentSearch — 当前 query string（含 ?）
 */
import { create } from "zustand";

interface RouterState {
  /** 当前路径，不含 query string */
  currentPath: string;
  /** 当前 query string，含 ? 前缀 */
  currentSearch: string;

  /** 导航到新路径 */
  push: (path: string) => void;
  /** 替换当前路径（不产生历史记录） */
  replace: (path: string) => void;
  /** 浏览器后退 */
  back: () => void;
  /** 浏览器前进 */
  forward: () => void;
}

/* ------------------------------------------------------------------ */
/*  浏览器环境安全读取                                                   */
/* ------------------------------------------------------------------ */

function getBrowserPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function getBrowserSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search || "";
}

/* ------------------------------------------------------------------ */
/*  Store 创建                                                          */
/* ------------------------------------------------------------------ */

export const useRouterStore = create<RouterState>()((set) => ({
  currentPath: getBrowserPath(),
  currentSearch: getBrowserSearch(),

  push: (path: string) => {
    // 分离路径和 query string
    const qIndex = path.indexOf("?");
    const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
    const search = qIndex >= 0 ? path.slice(qIndex) : "";

    if (pathname === getBrowserPath() && search === getBrowserSearch()) return;

    window.history.pushState({}, "", path);
    set({ currentPath: pathname, currentSearch: search });
  },

  replace: (path: string) => {
    const qIndex = path.indexOf("?");
    const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
    const search = qIndex >= 0 ? path.slice(qIndex) : "";

    if (pathname === getBrowserPath() && search === getBrowserSearch()) return;

    window.history.replaceState({}, "", path);
    set({ currentPath: pathname, currentSearch: search });
  },

  back: () => window.history.back(),
  forward: () => window.history.forward(),
}));

/* ------------------------------------------------------------------ */
/*  浏览器同步 — popstate 事件监听                                       */
/* ------------------------------------------------------------------ */

function syncWithBrowser() {
  if (typeof window === "undefined") return;

  window.addEventListener("popstate", () => {
    useRouterStore.setState({
      currentPath: window.location.pathname || "/",
      currentSearch: window.location.search || "",
    });
  });
}

syncWithBrowser();
