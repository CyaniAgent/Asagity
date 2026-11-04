/**
 * shellGithub.ts — 系统信息窗口的 GitHub 数据源（经 shell 网关代理）
 *
 * 通道：fetchShell(`/api/shell/github/{org-members|contributors}`) —
 * .NET Shell 模块服务端代理 api.github.com（CORS / 限流免疫），网关侧另有
 * 10 分钟共享缓存；这里再加一层 localStorage 缓存（同 TTL），让窗口反复开关
 * 不产生任何网络请求。
 *
 * 失败降级：上游错误时先回吐过期缓存（stale beats empty），两者皆无才 throw
 * ——调用方按 doctrine 显示 "—" / 静态兜底卡。
 */
import { fetchShell } from "@/lib/backend";

/** 项目 GitHub 组织（与后端 ShellModule.GithubRepo 同源硬编码 — 项目级身份）。 */
export const GITHUB_ORG = "CyaniAgent";
export const GITHUB_ORG_URL = `https://github.com/${GITHUB_ORG}`;

/** Shell 网关 github 列表项（snake_case 与 api.github.com 原始形状一致）。 */
export interface GithubPerson {
  login: string;
  avatar_url: string;
  html_url: string;
  /** contributors 专属：累计贡献次数（org-members 无此字段） */
  contributions?: number;
}

export type GithubListKind = "org-members" | "contributors";

const CACHE_PREFIX = "asgt_shell_gh_";
const TTL_MS = 10 * 60_000;

interface CacheEntry {
  at: number;
  items: GithubPerson[];
}

function readCache(kind: GithubListKind): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + kind);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    return Array.isArray(parsed?.items) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(kind: GithubListKind, items: GithubPerson[]): void {
  try {
    localStorage.setItem(CACHE_PREFIX + kind, JSON.stringify({ at: Date.now(), items }));
  } catch {
    // Quota / private-mode 下静默放弃缓存 — 不影响本次会话数据
  }
}

/**
 * 拉取 GitHub 列表（10 分钟本地缓存 + stale-on-error）。
 * 仅在"既无缓存又无上游"时 throw。
 */
export async function fetchGithubList(kind: GithubListKind): Promise<GithubPerson[]> {
  const cached = readCache(kind);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.items;

  try {
    const res = await fetchShell(`/api/shell/github/${kind}`);
    if (!res.ok) throw new Error(`shell github ${kind}: HTTP ${res.status}`);
    const json = (await res.json()) as { ok?: boolean; data?: unknown };
    if (!json?.ok || !Array.isArray(json.data)) throw new Error(`shell github ${kind}: bad payload`);
    const items = json.data as GithubPerson[];
    writeCache(kind, items);
    return items;
  } catch (err) {
    if (cached) return cached.items; // 过期快照也比空板块强
    throw err;
  }
}
