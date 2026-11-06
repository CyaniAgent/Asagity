/**
 * version.ts — 真版本号 → 解释性语义化展示（双层转换的唯一入口）
 *
 * 真版本号（内部，APP_VERSION 注入，/api/meta/version 原样返回）：
 *   Stable:  v2026.Q4 / v2026.Q4.1
 *   Eta:     v2026.Q4-eta.1
 *   Beta:    v2026.Q4-beta.1
 *   Dev:     2026.193+da1b434a      # {年份}.{CI 提取的 commit 总数}+{短哈希}
 *   Legacy:  v2026.Q4-dev.255+1a2b3c4d（历史记法，保留兼容）
 *
 * 解释性语义化展示（Ver. 前缀，仅前端渲染）：
 *   Stable:  Ver. 2026.Q4 / Ver. 2026.Q4.1
 *   Eta:     Ver. 2026.Q4.1 Eta Preview
 *   Beta:    Ver. 2026.Q4.1 Beta Preview
 *   Dev:     Ver. 2026 Build 193 (da1b434a)
 *   Legacy:  Ver. 2026.Q4.Dev commit 1a2b3c4d
 *
 * 生成器与注入链见 docs/architecture/versioning.md §4.1：
 *   scripts/version.sh（env > /VERSION > git 派生 > dev）→ APP_VERSION
 *   → 后端透传 → 本函数转换 → instance store。
 * 展示字符串只允许由本函数产出，组件不得自行拼接。
 */

import { useInstanceStore } from "@/stores/instance";

/**
 * 将内部版本标签转换为用户友好的显示格式。
 */
export function formatVersionDisplay(tag: string): string {
  if (!tag || tag === "dev") return "Ver. Dev";

  // 去除 v 前缀
  const v = tag.startsWith("v") ? tag.slice(1) : tag;

  // Dev（计数制，scripts/version.sh 生成）: 2026.193+da1b434a
  //   → Ver. 2026 Build 193 (da1b434a)
  // 真版本号保持机器可读（年份.提交总数+哈希），展示层转为解释性语义化。
  // 仅匹配纯数字年份+纯数字计数，与季度段（Q4/S4 含字母）无交集。
  const buildMatch = v.match(/^(\d{4})\.(\d+)\+([0-9a-fA-F]+)$/);
  if (buildMatch) {
    return `Ver. ${buildMatch[1]} Build ${buildMatch[2]} (${buildMatch[3]})`;
  }

  // Dev（历史记法）: 2026.Q4-dev.255+1a2b3c4d → Ver. 2026.Q4.Dev commit 1a2b3c4d
  // 版本段含季度代号字母（Q4）——字符类必须允许 [0-9A-Za-z.]，不能只 [\d.]
  const devMatch = v.match(/^([0-9A-Za-z.]+)-dev\.\d+\+(.+)$/);
  if (devMatch) {
    return `Ver. ${devMatch[1]}.Dev commit ${devMatch[2]}`;
  }

  // Eta: 2026.Q4-eta.1 → Ver. 2026.Q4 Eta Preview
  const etaMatch = v.match(/^([0-9A-Za-z.]+)-eta/);
  if (etaMatch) {
    return `Ver. ${etaMatch[1]} Eta Preview`;
  }

  // Beta: 2026.Q4-beta.1 → Ver. 2026.Q4 Beta Preview
  const betaMatch = v.match(/^([0-9A-Za-z.]+)-beta/);
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
