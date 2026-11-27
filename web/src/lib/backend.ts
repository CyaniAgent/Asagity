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

/**
 * Username/password auth is live on .NET (S5). The Go engine keeps its own
 * lite database, so sending these paths to it first produces ERR 14101 for
 * accounts registered through .NET. Email-challenge flows stay on Go.
 */
const NET_OWNED_AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/logout-all",
]);

function toNetOwnedAuthPath(path: string): string | null {
  const bare = path.split("?")[0];
  return NET_OWNED_AUTH_PATHS.has(bare) ? `${NET_API_PREFIX}${path.slice("/api".length)}` : null;
}

/**
 * Gateway-level failures from Vite/nginx: the Go engine is down (or the
 * reverse proxy could not reach it). These are just as fatal for the UI as a
 * transport error, so mirror them to the .NET backend.
 */
const GATEWAY_FAILURE_STATUSES = new Set([502, 503, 504]);

/** Streams are consumed by the first fetch; everything else can be replayed. */
function isReplayableBody(body?: BodyInit | null): boolean {
  if (body == null || typeof body === "string") return true;
  if (typeof Blob !== "undefined" && body instanceof Blob) return true;
  if (typeof FormData !== "undefined" && body instanceof FormData) return true;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) return true;
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true;
  return false;
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
 * Fetch with backend ownership: username/password auth goes straight to .NET;
 * all other paths try the primary (engine) first, then retry once against the
 * mirrored `/api-net` path when the engine is unreachable
 * (transport error) or the proxy reports 502/503/504. Real HTTP errors from a
 * live backend (4xx, 500) pass through so callers see the original contract.
 */
export async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  const owned = toNetOwnedAuthPath(path);
  if (owned !== null) {
    return fetch(owned, init);
  }

  const mirror = toApiNetPath(path);
  const canRetry = mirror !== null && isReplayableBody(init?.body);

  try {
    const res = await fetch(path, init);
    if (canRetry && GATEWAY_FAILURE_STATUSES.has(res.status)) {
      return fetch(mirror!, init);
    }
    return res;
  } catch (err) {
    if (canRetry && isNetworkFailure(err)) {
      return fetch(mirror!, init);
    }
    throw err;
  }
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

/**
 * Termity platform-shell gateway fetch.
 *
 * Per docs/architecture/tech-stack-audit.md the shell gateway endpoints
 * (meta / github / termity/*) are owned by .NET Verse.Module.Shell, while the
 * Go engine (:2048) only registers ping/vnet. fetchBackend only falls back on
 * transport errors, so a primary 404 means "this backend does not own the
 * route" — retry the .NET mirror once instead of surfacing a dead endpoint.
 */
export async function fetchShell(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetchBackend(path, init);
  if (res.status === 404 && path.startsWith("/api/shell/")) {
    const mirror = toApiNetPath(path);
    if (mirror) return fetch(mirror, init);
  }
  return res;
}
