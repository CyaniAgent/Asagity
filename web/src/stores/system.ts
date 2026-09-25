import { create } from "zustand";
import type { HostInfo } from "@/types/models";
import {
  API_HEALTH_PATH,
  ENGINE_HEALTH_PATH,
  NET_API_PREFIX,
  probeHealth,
} from "@/lib/backend";

export type BackendStatus = "both" | "engine-only" | "api-only" | "offline";

interface SystemState {
  isBackendOnline: boolean;
  isEngineOnline: boolean;
  isApiOnline: boolean;
  backendStatus: BackendStatus;
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
  isEngineOnline: true,
  isApiOnline: true,
  backendStatus: "both",
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

  // Dual-backend heartbeat: Go engine (:2048) + .NET API (:2050).
  // isBackendOnline stays true while EITHER side answers (backward compat
  // for NetworkStatus / MainLayout / timeline guards); the per-backend
  // flags expose the fine-grained state for debugging (Termity `vnet`).
  checkBackendHealth: async () => {
    const [engineOk, apiOk] = await Promise.all([
      probeHealth(ENGINE_HEALTH_PATH, 2000),
      probeHealth(API_HEALTH_PATH, 2000),
    ]);

    const status: BackendStatus = engineOk && apiOk
      ? "both"
      : engineOk
        ? "engine-only"
        : apiOk
          ? "api-only"
          : "offline";

    set({
      isEngineOnline: engineOk,
      isApiOnline: apiOk,
      backendStatus: status,
      isFirstCheck: false,
    });

    if (engineOk || apiOk) {
      get().restoreOnlineMode();
    } else if (!get().isDevMode) {
      get().triggerOfflineFallback();
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
    // Engine first (:2048), .NET mirror (:2050) as fallback.
    for (const path of ["/api/system/environment", `${NET_API_PREFIX}/system/environment`]) {
      try {
        const res = await fetch(path, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const data: HostInfo = await res.json();
        set({ hostInfo: data });
        return;
      } catch {
        // try next backend
      }
    }
    console.warn("Failed to fetch host info (engine :2048 + api :2050 unreachable)");
  },

  fetchHostInfoWithTimeout: () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch("/api/system/environment", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`engine responded ${res.status}`);
        return res.json();
      })
      .then((data: HostInfo) => {
        set({ hostInfo: data });
      })
      .catch(() =>
        // Fallback to .NET Verse.Api (:2050) before giving up.
        fetch(`${NET_API_PREFIX}/system/environment`, { signal: controller.signal })
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
      )
      .finally(() => {
        clearTimeout(timeoutId);
      });
  },
}));
