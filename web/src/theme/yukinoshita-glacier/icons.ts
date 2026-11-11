import { createElement } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck,
  CircleX,
  Clock,
  Columns3,
  Copy,
  EyeOff,
  Info,
  ListFilter,
  Menu,
  Mic,
  MoreHorizontal,
  Search,
  Square,
  SquareArrowOutUpRight,
  TriangleAlert,
  Upload,
  Wrench,
  X,
} from "lucide-react";

/**
 * Yukinoshita Glacier 图标注册表 — Astryx 内置 30 个语义名 → Lucide
 * （design-standard.md §7 S3 接管注册表）。
 *
 * 背景：Astryx `defaultIcons` 是 heroicons 风格兜底 SVG，其中 status 四枚
 * （success/error/warning/info）为 solid 填充——与全站 Lucide 线性语言
 * 同屏即双风格（铁律 4）。Astryx 官方指引：主题应以 `defineTheme({ icons })`
 * 覆盖兜底（global `registerIcons` 仅 dev 也会告警），故本注册表随主题走：
 * 换季换主题时图标一并交接。
 *
 * 约定：
 * - key 与 Astryx `IconName`（+ `numberInput:stepperDown` 扩展键）逐一对应，
 *   缺一个就漏一个双风格入口（测试锁定 30 键全覆盖）；
 * - 映射语义与全站 `Icon.tsx` iconMap 对齐（close→X、externalLink→
 *   SquareArrowOutUpRight、success→CircleCheck…），同名同形；
 * - glyph 按 Astryx 约定走 1em 基准（档位由 Icon 的 fontSize 控制：
 *   xsm 0.75rem / sm 1rem / md 1.25rem / lg 1.5rem）。
 *
 * 实现注记：
 * - 用 `createElement` 而非 JSX——主题构建的 jiti 加载器跑经典转译
 *   （React 需在作用域内），createElement 在任何转译器下都成立；
 * - `pnpm theme:build` 追踪本模块（theme 源 `icons:` 指向本导出），
 *   built 产物以 import 引用而非内联（React 元素不可序列化）。
 */
const glyph = (C: LucideIcon) => createElement(C, { width: "1em", height: "1em" });

export const yukinoshitaGlacierIcons = {
  close: glyph(X),
  chevronDown: glyph(ChevronDown),
  "numberInput:stepperDown": glyph(ChevronDown),
  chevronLeft: glyph(ChevronLeft),
  chevronRight: glyph(ChevronRight),
  chevronsLeft: glyph(ChevronsLeft),
  chevronsRight: glyph(ChevronsRight),
  check: glyph(Check),
  success: glyph(CircleCheck),
  error: glyph(CircleX),
  warning: glyph(TriangleAlert),
  info: glyph(Info),
  calendar: glyph(Calendar),
  clock: glyph(Clock),
  externalLink: glyph(SquareArrowOutUpRight),
  menu: glyph(Menu),
  moreHorizontal: glyph(MoreHorizontal),
  search: glyph(Search),
  upload: glyph(Upload),
  arrowUp: glyph(ArrowUp),
  arrowDown: glyph(ArrowDown),
  arrowsUpDown: glyph(ArrowUpDown),
  funnel: glyph(ListFilter),
  eyeSlash: glyph(EyeOff),
  viewColumns: glyph(Columns3),
  copy: glyph(Copy),
  checkDouble: glyph(CheckCheck),
  wrench: glyph(Wrench),
  stop: glyph(Square),
  microphone: glyph(Mic),
};
