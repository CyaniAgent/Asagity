/**
 * Yukinoshita Glacier（雪之下冰河）· 2026.Q4 赛季主题
 * =====================================================
 * 开发代号: Yukinoshita Glacier (雪之下冰河)
 * 色彩锚点: 冰河蓝(Glacier) / 霜灰(Frost) / 极光薄荷(Aurora) /
 *           冰莓红(Berry) / 融雪暖光(Melt) / 细雪紫影(Periwinkle)
 * 明版主导: 冰下暗面作为收容模式
 * Miku Green 档案: 本赛季起从 token 体系完全退出（品牌档案保留在 git 历史）
 *
 * 构建: pnpm exec astryx theme build src/theme/yukinoshita-glacier/yukinoshita-glacier.ts
 * 生成 yukinoshita-glacier.css/.js/.d.ts 后由 main.tsx 载入 CSS。
 * 色板候选: glacier.palette.ts（astryx-oklch-v1 生成，勿手改 — 改 seeds 重跑 palette.config.json）
 */
import { defineTheme } from "@astryxdesign/core/theme";
import { palette, black, white } from "./glacier.palette";

export const yukinoshitaGlacierTheme = defineTheme({
  name: "yukinoshita-glacier",

  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: "HarmonyOS Sans SC",
      fallbacks: "HarmonyOS Sans, ui-sans-serif, system-ui, sans-serif",
    },
    heading: {
      family: "HarmonyOS Sans SC",
      fallbacks: "HarmonyOS Sans, ui-sans-serif, system-ui, sans-serif",
    },
    code: {
      family: "JetBrains Mono",
      fallbacks: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
  },

  /* 4dp 基座 ×1 → inner 4 / element 8 / container 16 / page 24（rounded-2xl 家族对齐） */
  radius: { base: 4, multiplier: 1 },

  /* 冰面滑行动效：起手缓、收尾利（fit winter recall） */
  motion: {
    fast: 150,
    medium: 400,
    ratio: 0.75,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },

  tokens: {
    /* ── Accent · Glacier Blue ───────────────────────────────────────── */
    /* 光明面：白对比 4.8:1（按钮文字锚）暗面：冰缝渐亮 */
    "--color-accent": [palette.glacier.light["60"], palette.glacier.dark["75"]],
    "--color-accent-muted": [
      `${palette.glacier.light["60"]}33`,
      `${palette.glacier.dark["75"]}3F`,
    ],
    "--color-on-accent": [white, palette.glacier.dark["5"]],
    "--color-text-accent": [palette.glacier.light["60"], palette.glacier.dark["70"]],
    "--color-icon-accent": [palette.glacier.light["60"], palette.glacier.dark["75"]],

    /* ── 背景 · 雪原 / 冰下暗面 ────────────────────────────────────────── */
    "--color-background-body": [palette.frost.light["95"], palette.glacier.dark["5"]],
    "--color-background-surface": [white, palette.glacier.dark["10"]],
    "--color-background-card": [white, palette.glacier.dark["10"]],
    "--color-background-popover": [white, palette.glacier.dark["15"]],
    "--color-background-inverted": [palette.frost.light["5"], palette.frost.dark["100"]],
    "--color-background-muted": [
      `${palette.glacier.light["15"]}0C`,
      `${white}0C`,
    ],

    /* ── 文本 / 图标 ─────────────────────────────────────────────────── */
    "--color-text-primary": [palette.frost.light["5"], palette.frost.dark["90"]],
    "--color-text-secondary": [palette.frost.light["40"], palette.frost.dark["60"]],
    "--color-text-disabled": [palette.frost.light["70"], palette.frost.dark["35"]],
    "--color-icon-primary": [palette.frost.light["5"], palette.frost.dark["90"]],
    "--color-icon-secondary": [palette.frost.light["40"], palette.frost.dark["60"]],
    "--color-icon-disabled": [palette.frost.light["70"], palette.frost.dark["35"]],

    /* ── 语义状态 ─────────────────────────────────────────────────────── */
    "--color-success": [palette.aurora.light["50"], palette.aurora.dark["70"]],
    "--color-success-muted": [
      `${palette.aurora.light["50"]}33`,
      `${palette.aurora.dark["70"]}3F`,
    ],
    "--color-on-success": [white, palette.frost.dark["5"]],
    "--color-error": [palette.berry.light["60"], palette.berry.dark["80"]],
    "--color-error-muted": [
      `${palette.berry.light["60"]}33`,
      `${palette.berry.dark["80"]}3F`,
    ],
    "--color-on-error": [white, white],
    "--color-warning": [palette.melt.light["65"], palette.melt.dark["75"]],
    "--color-warning-muted": [
      `${palette.melt.light["65"]}33`,
      `${palette.melt.dark["75"]}3F`,
    ],
    "--color-on-warning": [palette.frost.light["5"], palette.frost.light["5"]],

    /* ── 线 / 轨 / 影 ────────────────────────────────────────────────── */
    "--color-border": [
      `${palette.glacier.light["20"]}1A`,
      `${palette.frost.dark["90"]}19`,
    ],
    "--color-border-emphasized": [
      palette.frost.light["75"],
      palette.glacier.dark["25"],
    ],
    "--color-skeleton": [palette.frost.light["75"], palette.frost.dark["35"]],
    "--color-track": [palette.frost.light["75"], palette.frost.dark["30"]],
    "--color-shadow": ["rgba(0, 45, 90, 0.12)", "rgba(0, 10, 25, 0.40)"],

    /* ── 遮罩 ────────────────────────────────────────────────────────── */
    "--color-overlay": [
      `${palette.glacier.light["10"]}66`,
      `${palette.frost.dark["10"]}99`,
    ],
    "--color-overlay-hover": [
      `${palette.glacier.light["15"]}0C`,
      `${white}0C`,
    ],
    "--color-overlay-pressed": [
      `${palette.glacier.light["15"]}19`,
      `${white}19`,
    ],
    "--color-neutral": [`${palette.glacier.light["20"]}1A`, `${white}33`],
    "--color-tint-hover": [black, white],
    "--color-on-dark": [white, white],
    "--color-on-light": [black, black],
  },

  localTokens: {
    /* 细雪紫影（话题/引用/装饰） */
    "--season-periwinkle": [palette.periwinkle.light["60"], palette.periwinkle.dark["80"]],
    /* FreeWindow 自家窗口圆角（延续 30px 桌面窗语） */
    "--radius-window": "30px",
    /* Glass 分级（design/DESIGN.md §4 四档映射 token 化） */
    "--blur-glass-light": "12px",
    "--blur-glass-medium": "24px",
    "--blur-glass-heavy": "40px",
    "--blur-glass-immersive": "64px",
    /* 赛季指纹 */
    "--season-slug": "yukinoshita-glacier",
    "--season-codename": "Yukinoshita Glacier",
    "--season-period": "2026.Q4",
  },
});
