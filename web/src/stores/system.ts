import { create } from "zustand";
import type { HostInfo } from "@/types/models";

interface SystemState {
  isBackendOnline: boolean;
  isFrontendOnlyMode: boolean;
  isDevMode: boolean;
  isInitialized: boolean;
  hasLaunched: boolean;
  isFirstCheck: boolean;
  isLoadFinished: boolean;
  isWelcomeDismissed: boolean;
  isMobile: boolean;
  initError: string | null;
  initErrorCode: string | null;
  initProgress: number;
  hostInfo: HostInfo | null;
  heartbeatInterval: ReturnType<typeof setInterval> | null;

  initSequence: () => Promise<void>;
  launchApp: () => void;
  triggerOfflineFallback: () => void;
  enableDevMode: (forever?: boolean) => void;
  disableDevMode: () => void;
  enableFrontendOnlyMode: () => void;
  restoreOnlineMode: () => void;
  checkBackendHealth: () => Promise<void>;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  fetchHostInfo: () => Promise<void>;
  fetchHostInfoWithTimeout: () => void;
}

export const ERROR_CODES = {
  INIT_FAILED: "ERR 12201",
  NETWORK_TIMEOUT: "ERR 12202",
  CONNECTION_FAILED: "ERR 11500",
  UNKNOWN: "ERR 9999",
} as const;

export const useSystemStore = create<SystemState>()((set, get) => ({
  isBackendOnline: true,
  isFrontendOnlyMode: false,
  isDevMode: false,
  isInitialized: false,
  hasLaunched: false,
  isFirstCheck: true,
  isLoadFinished: false,
  isWelcomeDismissed: false,
  isMobile: false,
  initError: null,
  initErrorCode: null,
  initProgress: 0,
  hostInfo: null,
  heartbeatInterval: null,

  initSequence: async () => {
    if (get().isInitialized) return;

    set({ isInitialized: true, initProgress: 100 });

    if (typeof window !== "undefined") {
      const { UAParser } = await import("ua-parser-js");
      const parser = new UAParser(navigator.userAgent);
      const device = parser.getDevice();
      const isMobile = device.type === "mobile" || device.type === "tablet";

      if (localStorage.getItem("asgt_dev_mode_forever") === "true") {
        get().enableDevMode(true);
      }

      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      } catch {
        console.warn("Font loading sync failed or timed out");
      }

      set({ isMobile });
    }

    get().fetchHostInfoWithTimeout();

    set({ isLoadFinished: true });

    if (!get().isMobile || get().isWelcomeDismissed) {
      get().launchApp();
    }
  },

  launchApp: () => {
    if (!get().isInitialized) return;

    if (typeof window !== "undefined") {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        ctx.resume().catch(() => {});
      } catch {
        // ignore
      }

      const silentAudio = new Audio("data:audio/ogg;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silentAudio.play().catch(() => {});
    }

    set({ hasLaunched: true });
    get().startHeartbeat();
  },

  triggerOfflineFallback: () => {
    if (get().isBackendOnline && !get().isDevMode) {
      set({ isBackendOnline: false });

      if (!get().isFirstCheck) {
        console.error("[System] Backend offline:", ERROR_CODES.CONNECTION_FAILED);
      }

      get().enableFrontendOnlyMode();
    }
  },

  enableDevMode: (forever = false) => {
    set({ isDevMode: true, isBackendOnline: true, isFrontendOnlyMode: false });

    if (typeof window !== "undefined" && forever) {
      localStorage.setItem("asgt_dev_mode_forever", "true");
    }
  },

  disableDevMode: () => {
    set({ isDevMode: false });

    if (typeof window !== "undefined") {
      localStorage.removeItem("asgt_dev_mode_forever");
    }
  },

  enableFrontendOnlyMode: () => {
    set({ isFrontendOnlyMode: true });
  },

  restoreOnlineMode: () => {
    if (!get().isBackendOnline || get().isDevMode) {
      set({
        isBackendOnline: true,
        isFrontendOnlyMode: false,
        isDevMode: false,
        isFirstCheck: false,
      });
    }
  },

  checkBackendHealth: async () => {
    try {
      const res = await fetch("/healthz", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.ok) {
        get().restoreOnlineMode();
        set({ isFirstCheck: false });
      } else {
        if (!get().isDevMode) {
          get().triggerOfflineFallback();
        }
      }
    } catch {
      if (!get().isDevMode) {
        get().triggerOfflineFallback();
      }
    }
  },

  startHeartbeat: () => {
    if (get().heartbeatInterval) return;

    get().checkBackendHealth();

    const interval = setInterval(() => {
      get().checkBackendHealth();
    }, 5000);

    set({ heartbeatInterval: interval });
  },

  stopHeartbeat: () => {
    const interval = get().heartbeatInterval;
    if (interval) {
      clearInterval(interval);
      set({ heartbeatInterval: null });
    }
  },

  fetchHostInfo: async () => {
    try {
      const res = await fetch("/api/system/environment");
      const data: HostInfo = await res.json();
      set({ hostInfo: data });
    } catch {
      console.warn("Failed to fetch host info");
    }
  },

  fetchHostInfoWithTimeout: () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch("/api/system/environment", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: HostInfo) => {
        set({ hostInfo: data });
      })
      .catch((err: unknown) => {
        const error = err as { name?: string; message?: string };
        if (error.name === "AbortError" || error.message?.includes("abort")) {
          console.warn("Host info fetch timeout, continuing without it");
        } else {
          console.warn("Failed to fetch host info:", err);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
  },
}));
