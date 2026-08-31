/**
 * Monitors device memory and auto-minimizes windows when thresholds are exceeded.
 *
 * - Uses navigator.deviceMemory (Chrome only, GB) when available.
 * - Falls back to counting open windows against MAX_WINDOWS.
 * - Calls onAutoMinimize(oldestIds) when limits are breached.
 */

const MAX_WINDOWS = 8;
const LOW_MEMORY_THRESHOLD_GB = 4;
const MEMORY_CHECK_INTERVAL_MS = 30_000;

let checkInterval: ReturnType<typeof setInterval> | null = null;
let onAutoMinimize: ((ids: string[]) => void) | null = null;

function getDeviceMemoryGB(): number {
  // navigator.deviceMemory: Chrome-only, returns approximate RAM in GB
  const nav = typeof navigator !== "undefined" ? (navigator as { deviceMemory?: number }) : undefined;
  return nav?.deviceMemory ?? 8; // assume 8 GB if unavailable
}

function isLowMemory(): boolean {
  return getDeviceMemoryGB() <= LOW_MEMORY_THRESHOLD_GB;
}

function check() {
  if (!onAutoMinimize) return;
  // Import store dynamically to avoid circular deps
  import("@/stores/freeWindow").then(({ useFreeWindowStore }) => {
    const { windows, minimizeOldest } = useFreeWindowStore.getState();
    const visibleWindows = windows.filter((w) => !w.isMinimized);

    if (isLowMemory() && visibleWindows.length > 2) {
      // Minimize excess windows (keep most-recently-focused 2)
      const sorted = [...visibleWindows].sort((a, b) => a.lastFocusedAt - b.lastFocusedAt);
      const toMinimize = sorted.slice(0, sorted.length - 2).map((w) => w.id);
      if (toMinimize.length > 0) {
        minimizeOldest(toMinimize);
        onAutoMinimize(toMinimize);
      }
    } else if (visibleWindows.length > MAX_WINDOWS) {
      // Hard cap: minimize oldest beyond limit
      const sorted = [...visibleWindows].sort((a, b) => a.lastFocusedAt - b.lastFocusedAt);
      const toMinimize = sorted.slice(0, visibleWindows.length - MAX_WINDOWS).map((w) => w.id);
      if (toMinimize.length > 0) {
        minimizeOldest(toMinimize);
        onAutoMinimize(toMinimize);
      }
    }
  });
}

export function startMemoryMonitor(cb: (minimizedIds: string[]) => void) {
  onAutoMinimize = cb;
  if (checkInterval) return;
  checkInterval = setInterval(check, MEMORY_CHECK_INTERVAL_MS);
}

export function stopMemoryMonitor() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  onAutoMinimize = null;
}
