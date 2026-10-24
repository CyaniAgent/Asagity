"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/backend";
import { useInstanceStore } from "@/stores/instance";

const POLL_MS = 30000;
const TIMEOUT_MS = 5000;

/** Meta response shapes — kept compatible with Termity `info` command parsing. */
type InstanceMetaBody = {
  ok?: boolean;
  data?: { name?: string; alias?: string; description?: string };
};
type VersionBody = { data?: { version?: string }; version?: string };

/** Field names the backend may use for the online count — first hit wins. */
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
 * Instance identity hydrator + live online count.
 *
 * Identity — one-shot from /api/meta/instance + /api/meta/version:
 *   hydrates the instance store so the welcome panel (and Termity) show
 *   backend-controlled values instead of developer fallback defaults.
 * Online — polled; stays `null` until the backend ships an online field,
 *   so the UI renders "—" with a gray dot instead of a fake number.
 */
export function useInstanceMeta(): string | null {
  const [online, setOnline] = useState<string | null>(null);

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

    /* ── Online count: polled, honest null ── */
    const load = async () => {
      try {
        const res = await fetchBackend("/api/meta/instance", {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) return;
        const hit = pickOnlineCount(await res.json().catch(() => null));
        if (alive) setOnline(hit);
      } catch {
        if (alive) setOnline(null); // offline — surface "—" instead of a stale value
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return online;
}
