import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorMode = "light" | "dark" | "system";

interface ThemeState {
  preference: ColorMode;
  systemPreference: "light" | "dark";
  isDark: boolean;
  currentMode: "light" | "dark";
  modeLabel: string;
  init: () => void;
  setPreference: (mode: ColorMode) => void;
  toggle: () => void;
  applyColorMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: "system",
      systemPreference: "dark",

      get isDark() {
        const state = get();
        if (state.preference === "system") {
          return state.systemPreference === "dark";
        }
        return state.preference === "dark";
      },

      get currentMode() {
        const state = get();
        if (state.preference === "system") {
          return state.systemPreference;
        }
        return state.preference;
      },

      get modeLabel() {
        const state = get();
        switch (state.preference) {
          case "light":
            return "浅色";
          case "dark":
            return "深色";
          case "system":
            return "跟随系统";
          default:
            return "跟随系统";
        }
      },

      init: () => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const systemPref = mediaQuery.matches ? "dark" : "light";
        set({ systemPreference: systemPref });

        mediaQuery.addEventListener("change", (e) => {
          set({ systemPreference: e.matches ? "dark" : "light" });
          get().applyColorMode();
        });

        get().applyColorMode();
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
    }
  )
);
