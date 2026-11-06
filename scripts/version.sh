#!/usr/bin/env bash
# version.sh — 生成 Asagity「真版本号」（内部机器可读格式，注入 APP_VERSION）
#
# 格式（Dev 分支，见 docs/architecture/versioning.md §4.1）：
#   {年份}.{CI 提取的 commit 总数}+{短哈希}     例：2026.193+da1b434a
#
# 优先级：
#   1. APP_VERSION 环境变量 —— 显式覆盖（发版 / CI 注入）
#   2. /VERSION 文件        —— 方案 A 事实源（落地后生效，当前不存在则跳过）
#   3. git 派生             —— 年份(UTC) + rev-list --count HEAD + short sha
#   4. dev                  —— 以上皆不可用时的哨兵值（前端展示为 "Ver. Dev"）
#
# 用法：APP_VERSION=2026.Q4.1 scripts/version.sh   # 或直接 scripts/version.sh
set -euo pipefail

# 1) 显式覆盖
if [ -n "${APP_VERSION:-}" ]; then
  printf '%s\n' "$APP_VERSION"
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 2) VERSION 文件（方案 A，存在时为唯一事实源）
if [ -f "$ROOT/VERSION" ]; then
  tr -d '[:space:]' < "$ROOT/VERSION"
  printf '\n'
  exit 0
fi

# 3) git 派生（Dev 分支真版本号）
if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  YEAR="$(date -u +%Y)"
  COUNT="$(git -C "$ROOT" rev-list --count HEAD)"
  SHA="$(git -C "$ROOT" rev-parse --short=8 HEAD)"
  printf '%s.%s+%s\n' "$YEAR" "$COUNT" "$SHA"
  exit 0
fi

# 4) 兜底
printf 'dev\n'
