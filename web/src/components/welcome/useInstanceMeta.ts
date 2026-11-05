"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/backend";
import { useInstanceStore } from "@/stores/instance";

const POLL_MS = 30000;
const TIMEOUT_MS = 5000;

export interface InstanceStats {
  /** 在线人数 — backend field not shipped yet → null (UI renders "—") */
  online: string | null;
  /** 用户总数 */
  users: string | null;
  /** 帖子总数 */
  posts: string | null;
}

/** Meta response shapes — kept compatible with Termity `info` command parsing. */
type InstanceMetaBody = {
  ok?: boolean;
  data?: { name?: string; alias?: string; description?: string };
};
type VersionBody = { data?: { version?: string }; version?: string };

/* Field names the future backend may use — first hit wins. */
const ONLINE_KEYS = ["online_count", "onlineCount", "online", "onlineUsers", "online_users"];
const USER_KEYS = ["user_count", "userCount", "users", "total_users", "totalUsers", "accounts", "accounts_count", "user_total"];
const POST_KEYS = ["post_count", "postCount", "posts", "total_posts", "totalPosts", "statuses_count", "statuses", "post_total"];

/** Digs a numeric/string field out of meta response layers (root / data / stats / statistics). */
function pickNumberString(data: unknown, keys: string[]): string | null {
  if (typeof data !== "object" || data === null) return null;
  const root = data as Record<string, unknown>;
  const layers: Array<Record<string, unknown>> = [root];
  for (const nested of ["data", "stats", "statistics"]) {
    if (root[nested] && typeof root[nested] === "object") {
      layers.push(root[nested] as Record<string, unknown>);
    }
  }
  for (const key of keys) {
    for (const layer of layers) {
      const v = layer[key];
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
      if (typeof v === "string" && v !== "") return v;
    }
  }
  return null;
}

/**
 * Instance identity hydrator + live stats poller.
 *
 * Identity — one-shot from /api/meta/instance + /api/meta/version:
 *   hydrates the instance store so the welcome panel (and Termity) show
 *   backend-controlled values instead of developer fallback defaults.
 * Stats — polled every 30s; any missing field stays `null` so the UI can
 *   render "—" instead of fake numbers (online turns green once known).
 */
export function useInstanceMeta(): InstanceStats {
  const [stats, setStats] = useState<InstanceStats>({ online: null, users: null, posts: null });

  useEffect(() => {
    let alive = true;

    /* ── Identity: one-shot hydrate ── */
    Promise.all([
      fetchBackend("/api/meta/instance", { signal: AbortSignal.timeout(TIMEOUT_MS) })
        .then((r) => (r.ok ? (r.json() as Promise<InstanceMetaBody>) : null))
        .catch(() => null),
      fetchBackend("/api/meta/version", { signal: AbortSignal.timeout(TIMEOUT_MS) })
        .then((r) => (r.ok ? (r.json() as Promise<VersionBody>) : null))
        .catch(() => null),
    ]).then(([metaBody, verBody]) => {
      if (!alive) return;
      const meta = metaBody?.data;
      if (meta?.name) useInstanceStore.getState().setName(meta.name);
      if (meta?.alias) useInstanceStore.getState().setAlias(meta.alias);
      if (meta?.description) useInstanceStore.getState().setDescription(meta.description);
      const version = verBody?.data?.version ?? verBody?.version;
      if (version) useInstanceStore.getState().setVersion(version);
    });

    /* ── Live stats: polled, honest nulls ── */
    const load = async () => {
      try {
        const res = await fetchBackend("/api/meta/instance", {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) return;
        const body = await res.json().catch(() => null);
        const next: InstanceStats = {
          online: pickNumberString(body, ONLINE_KEYS),
          users: pickNumberString(body, USER_KEYS),
          posts: pickNumberString(body, POST_KEYS),
        };
        if (alive && (next.online ?? next.users ?? next.posts) !== null) {
          setStats(next);
        }
      } catch {
        if (alive) setStats({ online: null, users: null, posts: null });
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return stats;
}
