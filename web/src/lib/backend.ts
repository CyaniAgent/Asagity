/**
 * Dual-backend endpoints (Go verse-engine :2048 + .NET Verse.Api :2050).
 *
 * Vite dev proxy mapping (see vite.config.ts):
 * - `/api/*`      -> http://localhost:2048 (Go engine, primary)
 * - `/healthz`    -> http://localhost:2048/healthz
 * - `/ws`         -> ws://localhost:2048 (engine owns WebSocket)
 * - `/api-net/*`  -> http://localhost:2050/api/* (.NET API, secondary)
 * - `/healthz-api`-> http://localhost:2050/healthz
 *
 * Both backends expose the same `/api/*` + `/healthz` surface
 * (C# modules are ported 1:1 from Go), so the fallback is a pure
 * path rewrite. Production deployments should mirror the same
 * split in nginx / Cloudflare.
 */

export const ENGINE_HEALTH_PATH = "/healthz";
export const API_HEALTH_PATH = "/healthz-api";

export const NET_API_PREFIX = "/api-net";

/**
 * Map a primary (engine) path to its .NET mirror.
 * Returns null when the path has no .NET equivalent.
 */
export function toApiNetPath(path: string): string | null {
  if (path === ENGINE_HEALTH_PATH) return API_HEALTH_PATH;
  if (path === "/api" || path.startsWith("/api/")) {
    return `${NET_API_PREFIX}${path.slice("/api".length)}` || NET_API_PREFIX;
  }
  return null;
}

/** True for network-level failures where a backend fallback is worth trying. */
export function isNetworkFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("load failed") ||
    err instanceof TypeError
  );
}

/**
 * Fetch with .NET fallback: try the primary (engine :2048) path first,
 * retry once against the mirrored `/api-net` path on network failure.
 * HTTP error statuses (4xx/5xx) are NOT retried — only transport failures.
 */
export async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (err) {
    const mirror = toApiNetPath(path);
    if (mirror && isNetworkFailure(err)) {
      return fetch(mirror, init);
    }
    throw err;
  }
  return res;
}

/** Probe one backend health endpoint with a timeout. Returns true when HTTP 2xx. */
export async function probeHealth(path: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const res = await fetch(path, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "Cache-Control": "no-cache" },
    });
    return res.ok;
  } catch {
    return false;
  }
}
