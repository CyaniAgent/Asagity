"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/backend";

const FALLBACK = "1";
const POLL_MS = 30000;

/** Field names the future backend may use — first hit wins. */
function pickOnlineCount(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const root = data as Record<string, unknown>;
  const candidates = [
    root.online_count,
    root.onlineCount,
    root.online,
    root.onlineUsers,
    root.online_users,
    (root.data as Record<string, unknown> | undefined)?.online_count,
    (root.data as Record<string, unknown> | undefined)?.onlineCount,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
    if (typeof c === "string" && c !== "") return c;
  }
  return null;
}

/**
 * Live online-count with graceful fallback.
 * Polls `/api/meta/instance` (dual-backend via fetchBackend);
 * backend has no such field yet, so it renders FALLBACK ("1")
 * until the backend ships it — no code change needed then.
 */
export function useOnlineCount(): string {
  const [count, setCount] = useState(FALLBACK);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetchBackend("/api/meta/instance", {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return;
        const hit = pickOnlineCount(await res.json().catch(() => null));
        if (alive && hit) setCount(hit);
      } catch {
        // keep fallback — offline is surfaced by StatusBar backend pill
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return count;
}
