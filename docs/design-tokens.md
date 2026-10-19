# Asagity Design Tokens — v2026.Q4「Yukinoshita Glacier（雪之下冰河）」

> 主题随开发代号换季重写。本期锚点：**冰河蓝 Glacier Blue**（主色）× **霜雪 Frost**（中性）×
> **极光薄荷 Aurora**（辅助）× **冰莓 Rose / 暖融 Amber / 细雪紫 Periwinkle**（气候点缀）。
> 明版主导，暗面「冰下」为收容模式。旧 Miku Green (#39C5BB) 自本季起**退出 token 体系**
> （品牌档案保留于 git 历史）。

- **实现载体**：Astryx `defineTheme` → `web/src/theme/yukinoshita-glacier/`
- **候选色板**：`glacier.palette.ts`（astryx-oklch-v1 生成，勿手改；改 `palette.config.json` 重跑）
- **换季流程**：见文末「季度架构」

---

## 1. 色彩锚点故事

| 取意来源 | 映射 |
| --- | --- |
| 冰河实拍：冰面蓝 | `Glacier` 主族（hue≈207） |
| 冰缝深处 | `Glacier` 深位（75–100 stop） |
| 极光现象 | `Aurora` 薄荷（成功 / 音乐 / 在线） |
| 雪原 ↔ 岩影 | `Frost` 冷中性（cool-v1 微冰味） |
| 冰莓（山地浆果） | `Berry` 错误 / 危险 / 未读 |
| 融雪暖阳 | `Melt` 警告 / Hi-Res 徽章 |
| 雪乃发梢紫晕 | `Periwinkle` 话题 / 引用 / 装饰 |

## 2. 主族 ramp（stop ↑ = 变亮；21 档，此处列关键档）

### Glacier（主族，seed `#2E76B8`）

| stop | Light | Dark | 语义 |
| --- | --- | --- | --- |
| 20 | `#00325C` | — | 尾号（Tailwind `cyan-950` 槽位） |
| 35 | `#005493` | — | `cyan-900` 槽位 |
| 45 | `#0063AC` | — | `cyan-700` 槽位 |
| 55 | `#1D6DB0` | `#2A9ECC` | hover-deep |
| **60** | **`#2E76B8`** ★ | `#3A9ECC` | **Accent 光明锚点（白底 4.8:1）** |
| 75 | `#78B2EE` | **`#7FC9F0`** ★ | **Accent 暗面锚点** |
| 85 | `#B4D9FF` | — | 冰面玻璃高光 |
| 95 | `#E6F2FF` | — | 雪融底（Tailwind `cyan-50` 槽位） |

### Aurora（seed `#33A87D`，纯薄荷 —— 非 Miku 血统）

| stop | Light | Dark |
| --- | --- | --- |
| 50 | **`#0C8462`**（success lit） | `#258C6A` |
| 65 | `#429E7C` | `#3BC395` |
| 70 | — | **`#52D2A4`**（success dark） |

### море 气候点各族

| 族 | seed | Light 锚 | Dark 锚 |
| --- | --- | --- | --- |
| Berry | `#C73E5F` | 60 `#C73E5F` | 80 `#F58CA5` |
| Melt | `#C0731A` | 65 `#B26018` | 75 `#F2BE5A` |
| Periwinkle | `#5A63C7` | 60 `#5A63C7` | 80 `#ACB2F2` |
| Frost（neutral·cool-v1） | `#4E6273` | 5 `#0E1115` / 95 `#EDF1F6` | 5 `#0F1114` / 90 `#DEE3E9` |

## 3. 语义 Tokens（`--color-*`，built CSS 已含全部 118 overrides）

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--color-accent` | `#2E76B8` | `#7FC9F0` | 按钮 / 链接 / 光效 |
| `--color-on-accent` | `#FFFFFF` | `#001421` | accent 表面文字（暗面用深冰字） |
| `--color-accent-muted` | `#2E76B833` | `#7FC9F03F` | 聚焦涟漪 / 悬停底 |
| `--color-text-accent` | `#2E76B8` | `#6ABCE5` | 文字级 accent |
| `--color-background-body` | `#EDF1F6`（雪原） | `#001421`（冰下） | 页面基面 |
| `--color-background-surface` | `#FFFFFF` | `#001F2F` | 卡片 / 面板 |
| `--color-background-popover` | `#FFFFFF` | `#002A3D` | 弹层 |
| `--color-background-inverted` | `#0E1115` | `#FFFFFF` | 反转底 |
| `--color-text-primary` | `#0E1115` | `#DEE3E9` | 主文字 |
| `--color-text-secondary` | `#575F68` | `#8A9299` | 次文字 |
| `--color-text-disabled` | `#A4ACB5` | `#4D535A` | 禁用 |
| `--color-success` | `#0C8462` | `#52D2A4` | Aurora 位：成功 / 在线 / Lossless |
| `--color-error` | `#C73E5F` | `#F58CA5` | Berry 位：错误 / 未读 |
| `--color-warning` | `#B26018` | `#F2BE5A` | Melt 位：警告 / Hi-Res |
| `--color-border` | `#00325C1A` | `#DEE3EA19` | 冰纹细线 |
| `--color-border-emphasized` | `#B2BAC2` | `#00415C` | 加强边 |
| `--color-track` / `--color-skeleton` | `#B2BAC2` | `#42474E` / `#4D535A` | 轨道 / 骨架 |
| `--color-shadow` | `rgba(0,45,90,.12)` | `rgba(0,10,25,.40)` | 深冰投影 |

### 局部 Token（`localTokens`，赛季专属）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--season-periwinkle` | `#5A63C7` / `#ACB2F2` | 话题 / 引用 / 装饰 |
| `--radius-window` | `30px` | FreeWindow 桌面窗圆角（不进 Astryx 半径标架） |
| `--blur-glass-light/medium/heavy/immersive` | `12/24/40/64px` | DESIGN.md §4 四档玻璃 → token 化 |
| `--season-slug` / `--season-codename` / `--season-period` | 文案 | 赛季指纹（About 页 / splash） |

## 4. 形 / 动 / 字

| 配置 | 值 | 说明 |
| --- | --- | --- |
| `radius` | base `4` × multiplier `1` | inner 4 / element 8 / **container 16**（rounded-2xl 家族）/ page 24 |
| `motion` | fast `150ms` / medium `400ms` / ratio `.75` / easing `cubic-bezier(.2,.8,.2,1)` | **冰面滑行**：起手缓、收尾利 |
| `typography` | 基 14 · 比率 1.2；HarmonyOS Sans SC + JetBrains Mono | 字体不换季（CJK 兼容） |

## 5. Tailwind 兼容槽位（过渡层）

`globals.css @theme inline` 中 **类别名不动（`cyan-*`），数值整体换血为 Glacier ramp**：

| Tailwind | Glacier 槽位 | 值 |
| --- | --- | --- |
| `cyan-50` | light[95] | `#E6F2FF` |
| `cyan-100` | light[90] | `#CDE6FF` |
| `cyan-200` | light[85] | `#B4D9FF` |
| `cyan-300` | light[75] | `#78B2EE` |
| `cyan-400` | light[65] | `#4187C8` |
| `cyan-500` | light[60] ★ | `#2E76B8` |
| `cyan-600` | light[55] | `#1D6DB0` |
| `cyan-700` | light[45] | `#0063AC` |
| `cyan-800` | light[40] | `#005EA2` |
| `cyan-900` | light[35] | `#005493` |
| `cyan-950` | light[20] | `#00325C` |

> 544 处既有 `cyan-*` 类名**零改动换季**。新代码一律用语义别名：
> `bg-brand` / `text-fg` / `bg-plate` / `bg-sheet` / `bg-popover` / `text-fgdim` /
> `text-ok` / `text-bad` / `text-warn` / `border-line` / `text-peri` /
> `rounded-freewin` / `blur-glasslight…glassimmersive`。
> P3 清扫完成后 `cyan-*` 槽位退役。

### Migration map（Miku → Glacier）

| 旧值 | 新值 |
| --- | --- |
| `#39C5BB` primary | `#2E76B8`（lit）/ `#7FC9F0`（dark）→ 语义 `accent` |
| `#22D3EE` glow | Glacier 65–75 停位 |
| `#7BE0DC` hover | Glacier 75 `#78B2EE` |
| `#2B9F98` active | Glacier 55 `#1D6DB0` |
| `rgba(57,197,187,*)` 滚动条/辉光 | `rgba(46,118,184,*)` |

### 音质徽章（继承自旧规范，换季位）

| 质量级 | 季席 Token |
| --- | --- |
| Hi-Res | `warning`（Melt） |
| Lossless | `success`（Aurora） |
| HQ | Aurora deep（light[50]） |
| Standard | Frost 40 |
| Low | Frost 25 |

## 6. 明暗模式机制

- 全部语义值编译为 CSS `light-dark(lit, dark)` → **跟随 `color-scheme`**；
- `globals.css` 已将 `html.light/.dark`（theme store 写入的 class）同步到 `color-scheme`；
- `index.html` 默认 `data-theme="light"` + `data-astryx-theme="yukinoshita-glacier"`（明版主导）；
- Tailwind `dark:` 变体改由 `.dark` class 驱动（`@custom-variant`，与 store 行为对齐）。

## 7. 季度架构（换季手册）

```
web/src/theme/yukinoshita-glacier/
├── palette.config.json          ← 生成请求（6 族 seeds + anchors + vibrancy 45 + cool-v1）
├── glacier.palette.ts           ← 候选色板（CLI 生成，勿手改）
├── glacier.palette.receipt.json ← 复现凭据
├── palette.preview.html         ← 人工审阅件
├── yukinoshita-glacier.ts       ← defineTheme（唯一手写件）
└── yukinoshita-glacier.{css,js,d.ts}  ← build 产物（main.tsx 载入 css）
```

换季 / 微调命令：

```bash
# 改 seeds 后重跑色板候选
pnpm exec astryx theme palette generate src/theme/yukinoshita-glacier/palette.config.json \
  -o src/theme/yukinoshita-glacier/glacier.palette.ts \
  --preview src/theme/yukinoshita-glacier/palette.preview.html -f
# 重编译主题
pnpm exec astryx theme build src/theme/yukinoshita-glacier/yukinoshita-glacier.ts
```

下季（2027.Q1）起 `src/theme/` 下并列新季目录即可；Q1 上线多季切换时再启用
`astryx theme build --family` 键族产物。

## 8. 遗留规则继承

- **Luminance 阈值公式**（旧 §动态亮度）：由 `--color-on-accent` 等标准面接替；少量自绘
  动态着色场景（歌词色提取）仍可沿用 `0.2126R + 0.7152G + 0.0722B > 140 → 黑字`。
- **图标体系**：Fluent UI System Icons 不变（Astryx 主题 icon registry 换装另议）。
- **玻璃分级 / 布局比例 / 歌词 focus-blur**：数值入 token 或按 DESIGN.md，见上表。

---
*Yukinoshita Glacier · 2026.Q4 — Implemented via Astryx oklch-v1; Miku Green retired with honours.*
