import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorMode = "light" | "dark" | "system";

/** Pure derivation from plain state fields — NEVER store getters: zustand's
 * Object.assign merges bake getter snapshots into the state object, leaving
 * subscribers stale (the dark-theme wrapper regression). */
export function resolveMode(
  preference: ColorMode,
  systemPreference: "light" | "dark",
): "light" | "dark" {
  return preference === "system" ? systemPreference : preference;
}

export function resolveModeLabel(preference: ColorMode): string {
  switch (preference) {
    case "light":
      return "浅色";
    case "dark":
      return "深色";
    default:
      return "跟随系统";
  }
}

interface ThemeState {
  preference: ColorMode;
  systemPreference: "light" | "dark";
  _mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null;
  init: () => void;
  destroy: () => void;
  setPreference: (mode: ColorMode) => void;
  toggle: () => void;
  applyColorMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: "system",
      // 首帧即读取系统偏好：避免 Theme provider 初次渲染拿到过期的 "dark" 而闪一下暗色
      systemPreference:
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      _mediaQueryHandler: null,

      init: () => {
        if (typeof window === "undefined") return;

        // zustand v5 的 persist 是异步 rehydrate：必须等读取完成再写，
        // 否则下面 set() 会把默认值写回 localStorage，把用户选好的明暗偏好覆盖掉。
        void Promise.resolve(useThemeStore.persist.rehydrate()).then(() => {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const systemPref = mediaQuery.matches ? "dark" : "light";
          set({ systemPreference: systemPref });

          const handler = (e: MediaQueryListEvent) => {
            set({ systemPreference: e.matches ? "dark" : "light" });
            get().applyColorMode();
          };
          mediaQuery.addEventListener("change", handler);
          set({ _mediaQueryHandler: handler });

          get().applyColorMode();
        });
      },

      destroy: () => {
        if (typeof window === "undefined") return;
        const handler = get()._mediaQueryHandler;
        if (handler) {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          mediaQuery.removeEventListener("change", handler);
          set({ _mediaQueryHandler: null });
        }
      },

      setPreference: (mode) => {
        set({ preference: mode });
        if (typeof window !== "undefined") {
          localStorage.setItem("asagity-color-mode", mode);
          get().applyColorMode();
        }
      },

      toggle: () => {
        const current = get().preference;
        if (current === "light") {
          get().setPreference("dark");
        } else if (current === "dark") {
          get().setPreference("system");
        } else {
          get().setPreference("light");
        }
      },

      applyColorMode: () => {
        if (typeof window === "undefined") return;

        const root = document.documentElement;
        const state = get();
        const isDark = state.preference === "system"
          ? state.systemPreference === "dark"
          : state.preference === "dark";

        root.classList.remove("light", "dark");
        root.classList.add(isDark ? "dark" : "light");
        root.setAttribute("data-theme", isDark ? "dark" : "light");
      },
    }),
    {
      name: "asagity-theme",
      partialize: (state) => ({ preference: state.preference }),
      // 手动控制 rehydrate 时机（见 init()）：避免默认值先写回覆盖用户偏好
      skipHydration: true,
    }
  )
);
