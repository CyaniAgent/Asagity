import { fetchShell } from "@/lib/backend";

/**
 * Termity 免登录进入（guest gate）的 8 位验证码客户端。
 *
 * 后端 Verse.Module.Shell 持有唯一事实源：每次申请都随机铸造一码
 * （0-9 + A-Z，36^8 组合），同时打印到后端运行日志；本模块负责
 * 把码取回并打进浏览器开发者工具控制台，再把用户输入提交校验。
 */

export const GUEST_CODE_LENGTH = 8;
export const GUEST_CODE_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 过滤用户输入：仅保留 0-9 / A-Z（不区分大小写），截断至 8 位。 */
export function normalizeGuestCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, GUEST_CODE_LENGTH);
}

async function readEnvelope(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const data: unknown = await res.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function errorCodeOf(body: Record<string, unknown> | null): string | undefined {
  const err = body?.error;
  if (err && typeof err === "object") {
    const code = (err as Record<string, unknown>).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

export type GuestIssueResult = { ok: true; code: string } | { ok: false };

/** 向后端申请新验证码（后端同时打印到运行日志）。 */
export async function issueGuestCode(): Promise<GuestIssueResult> {
  try {
    const res = await fetchShell("/api/shell/termity/guest-code", {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const body = await readEnvelope(res);
    const data = body?.ok === true && body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;
    const code = typeof data?.code === "string" ? data.code : null;
    return code && code.length === GUEST_CODE_LENGTH ? { ok: true, code } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export type GuestVerifyStatus = "valid" | "mismatch" | "expired" | "error";

/** 纯函数：HTTP 状态 + 后端错误码 → 验证结果分类（便于单测）。 */
export function classifyVerifyResponse(status: number, errorCode?: string): GuestVerifyStatus {
  if (status >= 200 && status < 300) return "valid";
  if (errorCode === "GUEST_CODE_MISMATCH") return "mismatch";
  if (errorCode === "GUEST_CODE_EXPIRED") return "expired";
  // 信封解析失败时按状态码兜底（本端点401=码错、410=码失效）
  if (status === 401) return "mismatch";
  if (status === 410) return "expired";
  return "error";
}

/** 提交验证。 */
export async function verifyGuestCode(code: string): Promise<GuestVerifyStatus> {
  try {
    const res = await fetchShell("/api/shell/termity/guest-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ code }),
    });
    const body = await readEnvelope(res);
    return classifyVerifyResponse(res.status, errorCodeOf(body));
  } catch {
    return "error";
  }
}

/**
 * 把验证码打进浏览器开发者工具控制台（Yukinoshita Glacier 配色）。
 * 这是 guest gate 的取码途径之一（另一处是后端运行日志）。
 */
export function logGuestCodeToConsole(code: string, label: string, hint: string): void {
  console.log(
    `%c${label}%c ${code}`,
    "color:#fff;background:#2E76B8;padding:2px 8px;border-radius:6px;font-weight:bold;font-size:12px",
    "color:#2E76B8;background:#E6F2FF;padding:2px 10px;border-radius:6px;" +
      "font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:4px;font-weight:bold"
  );
  if (hint) console.log(`%c${hint}`, "color:#575F68;font-size:11px");
}
