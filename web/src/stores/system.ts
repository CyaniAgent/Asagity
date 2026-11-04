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
  fetchHostInfoWithTimeout: () => Promise<void>;
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

  /**
   * 启动序列 — 分阶段真进度（0→100 由真实阶段推进，绝不假装满格）。
   * 阶段：字体就绪(≤2s) → 设备解析 → hostInfo(封顶2.5s) → 最低驻留防闪现。
   * SplashScreen 的进度条/风味文案均以此为数据源。
   */
  initSequence: async () => {
    if (get().isInitialized) return;
    const startedAt = performance.now();

    set({ isInitialized: true, initProgress: 15 });

    if (typeof window !== "undefined") {
      // 阶段 1/4 · 字体就绪（2s 超时兜底，不因字体卡死开屏）
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      } catch {
        console.warn("Font loading sync failed or timed out");
      }
      set({ initProgress: 55 });

      // 阶段 2/4 · UA/设备解析
      const { UAParser } = await import("ua-parser-js");
      const parser = new UAParser(navigator.userAgent);
      const device = parser.getDevice();
      const isMobile = device.type === "mobile" || device.type === "tablet";

      if (localStorage.getItem("asgt_dev_mode_forever") === "true") {
        get().enableDevMode(true);
      }

      set({ isMobile, initProgress: 70 });
    } else {
      set({ initProgress: 70 });
    }

    // 阶段 3/4 · 实例 hostInfo 真等待（2.5s 封顶——离线/慢后端不拖死开屏）
    await Promise.race([
      get().fetchHostInfoWithTimeout(),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
    set({ initProgress: 92 });

    // 阶段 4/4 · 最低驻留：防止开屏一闪而过，保证入场动画完整播完
    const MIN_SPLASH_MS = 1000;
    const elapsed = performance.now() - startedAt;
    if (elapsed < MIN_SPLASH_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS - elapsed));
    }

    set({ isLoadFinished: true, initProgress: 100 });

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

  /** hostInfo 探测（5s 自超时，可 await — initSequence 阶段 3 以 2.5s 封顶竞速）。 */
  fetchHostInfoWithTimeout: () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    return fetch("/api/system/environment", { signal: controller.signal })
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
