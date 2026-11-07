/**
 * version.ts — 真版本号 → 解释性语义化展示（双层转换的唯一入口）
 *
 * 真版本号（内部，机器可读）：
 *   Dev:      2026.204+73f2b407     # {年份}.{commit 总数}+{短哈希}
 *             —— web/package.json "version"，由 CI dump-dev-version 用
 *                scripts/version.sh（git 派生）回写，与后端 APP_VERSION 同源
 *   Stable:   v2026.Q4 / v2026.Q4.1
 *   Eta:      v2026.Q4-eta.1
 *   Beta:     v2026.Q4-beta.1
 *   Legacy:   v2026.Q4-dev.255+1a2b3c4d（历史记法，保留兼容）
 *   哨兵:     dev
 *
 * 解释性语义化展示（Ver. 前缀，仅前端渲染）：
 *   Dev:      Ver. 2026 Build 204 (73f2b407)   ← parseBuildVersion 三键值
 *   Stable:   Ver. 2026.Q4 / Ver. 2026.Q4.1
 *   Eta:      Ver. 2026.Q4.1 Eta Preview
 *   Beta:     Ver. 2026.Q4.1 Beta Preview
 *   Legacy:   Ver. 2026.Q4.Dev commit 1a2b3c4d
 *   哨兵:     Ver. Dev
 *
 * 读取方式（2026-11-07 换源，单一信源）：前端**不再 fetch 后端**
 * /api/meta/version——构建期静态导入 package.json 的 version（CI 回写），
 * 启动时 initAppVersion() 一次语义化写入 instance store。杜绝旧后端返回
 * dev 造成的展示退化与多路径写入赛跑。后端 /api/meta/version 仍服务
 * 机器链路（日志 / 运维 / 远程客户端），只是前端不再消费。
 *
 * 生成器与注入链见 docs/architecture/versioning.md §4.1：
 *   scripts/version.sh（env > /VERSION > git 派生 > dev）
 *   → CI dump-dev-version 回写 web/package.json → 本函数转换 → instance store。
 * 展示字符串只允许由本函数产出，组件不得自行拼接。
 */

import { version as PACKAGE_VERSION } from "../../package.json";
import { useInstanceStore } from "@/stores/instance";

/** Dev 计数制真版本号的三键值语义化拆解。 */
export interface BuildVersion {
  /** {updateYear} — 构建时 UTC 年份（发布时点语义，versioning.md §5.1） */
  updateYear: string;
  /** {commitsTotal} — CI 提取的 commit 总数 */
  commitsTotal: string;
  /** {latestCommitHash} — 最新 commit 短哈希 */
  latestCommitHash: string;
}

/**
 * 拆解 Dev 计数制真版本号：
 *   2026.204+73f2b407 → { updateYear: "2026", commitsTotal: "204", latestCommitHash: "73f2b407" }
 * 季度制 / eta / beta / 哨兵等非计数制记法一律返回 null（与展示分支无交集）。
 */
export function parseBuildVersion(tag: string): BuildVersion | null {
  if (!tag) return null;
  const v = tag.startsWith("v") ? tag.slice(1) : tag;
  const m = v.match(/^(\d{4})\.(\d+)\+([0-9a-fA-F]+)$/);
  if (!m) return null;
  return { updateYear: m[1], commitsTotal: m[2], latestCommitHash: m[3] };
}

/**
 * 将内部版本标签转换为用户友好的显示格式。
 */
export function formatVersionDisplay(tag: string): string {
  if (!tag || tag === "dev") return "Ver. Dev";

  // 去除 v 前缀
  const v = tag.startsWith("v") ? tag.slice(1) : tag;

  // Dev（计数制，scripts/version.sh 生成 → CI 回写 package.json）:
  //   2026.204+73f2b407 → Ver. 2026 Build 204 (73f2b407)
  // 真版本号保持机器可读（年份.提交总数+哈希），展示层转为解释性语义化。
  // 仅匹配纯数字年份+纯数字计数，与季度段（Q4/S4 含字母）无交集。
  const build = parseBuildVersion(v);
  if (build) {
    return `Ver. ${build.updateYear} Build ${build.commitsTotal} (${build.latestCommitHash})`;
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
 * 启动时把 package.json 的真版本号语义化后写入 instance store（零网络）。
 * ClientLayout 挂载时调用一次即可；展示值全站唯一来源。
 */
export function initAppVersion(): void {
  useInstanceStore.getState().setVersion(formatVersionDisplay(PACKAGE_VERSION));
}
