/**
 * version.ts — 版本解析与展示工具
 *
 * 内部 Git 标签格式（由 APP_VERSION 环境变量注入）：
 *   Stable:  v2026.Q4 / v2026.Q4.1
 *   Eta:     v2026.Q4-eta.1
 *   Beta:    v2026.Q4-beta.1
 *   Dev:     v2026.Q4-dev.255+1a2b3c4d
 *
 * 外部显示格式（Ver. 前缀）：
 *   Stable:  Ver. 2026.Q4 / Ver. 2026.Q4.1
 *   Eta:     Ver. 2026.Q4.1 Eta Preview
 *   Beta:    Ver. 2026.Q4.1 Beta Preview
 *   Dev:     Ver. 2026.Q4.Dev commit 1a2b3c4d
 */

import { useInstanceStore } from "@/stores/instance";

/**
 * 将内部版本标签转换为用户友好的显示格式。
 */
export function formatVersionDisplay(tag: string): string {
  if (!tag || tag === "dev") return "Ver. Dev";

  // 去除 v 前缀
  const v = tag.startsWith("v") ? tag.slice(1) : tag;

  // Dev: 2026.Q4-dev.255+1a2b3c4d → Ver. 2026.Q4.Dev commit 1a2b3c4d
  const devMatch = v.match(/^([\d.]+)-dev\.\d+\+(.+)$/);
  if (devMatch) {
    return `Ver. ${devMatch[1]}.Dev commit ${devMatch[2]}`;
  }

  // Eta: 2026.Q4-eta.1 → Ver. 2026.Q4 Eta Preview
  const etaMatch = v.match(/^([\d.]+)-eta/);
  if (etaMatch) {
    return `Ver. ${etaMatch[1]} Eta Preview`;
  }

  // Beta: 2026.Q4-beta.1 → Ver. 2026.Q4 Beta Preview
  const betaMatch = v.match(/^([\d.]+)-beta/);
  if (betaMatch) {
    return `Ver. ${betaMatch[1]} Beta Preview`;
  }

  // Stable: 2026.Q4 / 2026.Q4.1 → Ver. 2026.Q4 / Ver. 2026.Q4.1
  return `Ver. ${v}`;
}

/**
 * 从后端 /api/meta/version 获取版本并更新全局 store。
 * 应用启动时调用一次即可。
 */
export async function fetchAppVersion(): Promise<void> {
  try {
    const res = await fetch("/api/meta/version");
    if (!res.ok) return;
    const data = await res.json();
    const raw = data?.version as string | undefined;
    if (raw) {
      useInstanceStore.getState().setVersion(formatVersionDisplay(raw));
    }
  } catch {
    // 后端未启动时静默失败，保留默认版本
  }
}
