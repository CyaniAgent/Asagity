# Asagity 界面设计规范 — v2「中性基准（Neutral Baseline）」

> 状态：**2026-11-09 制定，欢迎页首审完成（§5 审计 / §6 改进清单）；
> 图标库选型完成（§7，决定 Fluent → Lucide）**
> 适用范围：欢迎页及后续所有页面。规范性条文以本文为准；季节色值仍以
> [`design-tokens.md`](./design-tokens.md) 为准；[`DESIGN.md`](./DESIGN.md) 中
> §5 Glows、§8 渐变按钮等与本文冲突的条目**废除**（见 §8）。

---

## 0. TL;DR — 四条铁律

1. **色彩受控**：底色与文字只用中性令牌；主要操作靠**明暗对比**（inverted 实底）
   突出；**取消一切渐变，不发光**。
2. **变量统一**：间距与圆角只用**固定档位**分层；**组内紧凑，组间留白**
   （间距 = 内间距 + 外间距，成对设计）。
3. **左缘对齐**：同一类元素默认共享同一条左边缘。
4. **做减法**：删掉表情符号、感叹号、装饰徽章；图标统一只用**一套线性
   （Fluent Regular）**。

---

## 1. 色彩系统（规范）

### 1.1 中性色是默认

| 用途 | Token（语义别名） | 说明 |
| --- | --- | --- |
| 页面底 | `--color-background-body` | 雪原 `#EDF1F6` / 冰下 `#001421` |
| 卡片/面板底 | `bg-sheet`（background-surface） | 一切容器底色 |
| 弹层底 | `bg-popover` | 菜单/浮层 |
| 主文字 | `text-fg`（= `--color-text-primary`） | 中性 |
| 次文字 | `text-fgdim`（secondary） | 中性 |
| 描边 | `border-line` | 中性细线 |
| 反转面 | `bg-invert`（background-inverted） | 明 `#0E1115` / 暗 `#FFFFFF` |

**底色与文字一律中性**；不得为"好看"给正文/容器上主题色底或彩色文字。

### 1.2 主要操作 = 明暗对比（inverted），不是彩色

- **Primary CTA**：`bg-invert` + 高对比反字（明版黑底浅字 / 暗版白底深字，
  文字取 `background-body` 档），**无渐变、无发光、无彩色**。
- 一屏只允许一个 inverted 实底按钮（即"主要操作"）；次要操作用
  `bg-sheet`/描边/ghost，靠**明暗层级**而不是颜色数量区分主次。
- `accent`（Glacier 蓝）收窄用途：**链接、焦点环、选中态**——不作大面积底，
  不作正文色，不作按钮渐变端。

### 1.3 状态色是唯一例外

`ok / bad / warn` 仅限**状态点与状态值**（在线数、心跳芯片的值）。禁止把
状态色扩展为装饰（彩色标题、彩色图标底、彩色徽章）。

### 1.4 禁用清单

- ❌ 渐变：`bg-gradient-*` / `linear-gradient` 作装饰底（含"fallback 渐变层"）
- ❌ 发光：`glow-*` 工具类、`box-shadow: 0 0 Npx <彩色>`、`drop-shadow` 彩色光
- ❌ 硬编码色值：组件里出现 `#hex` / `text-gray-*` / `bg-emerald-*` 等
  原始色板类（一律走语义令牌，`dark:` 手动分支由 `light-dark()` 令牌接管）
- ❌ 彩色投影/氛围光斑（blur 光晕层）

投影（非发光的深度阴影）按既有档位使用，不新增 `shadow-2xl` 以上的层级。

---

## 2. 间距与圆角（固定档位）

### 2.1 圆角档位（4 档 + 2 特例）

| 档 | 类 | 值 | 用途 |
| --- | --- | --- | --- |
| inner | `rounded-sm` | 4px | 内嵌块、小标签 |
| element | `rounded-lg` | 8px | 行、输入框、图标块、按钮 |
| container | `rounded-2xl` | 16px | 卡片、面板、菜单 |
| page | `rounded-3xl` | 24px | 页面级容器、自由窗口 |
| 特例 | `rounded-full` | — | **仅**胶囊芯片与圆头像 |
| 特例 | `rounded-freewin` | 30px | 自由窗口（`--radius-window`，保留） |

**禁用** `rounded-xl`(12px)、`rounded-md`(6px)、`rounded-[Npx]` 任意值
（窗口 30px 特例除外）。

### 2.2 间距档位（4px 网格整数档）

| 档 | 类 | 值 |
| --- | --- | --- |
| 1 | `gap-1` / `p-1` | 4px |
| 2 | `gap-2` / `p-2` | 8px |
| 3 | `gap-3` / `p-3` | 12px |
| 4 | `gap-4` / `p-4` | 16px |
| 5 | `gap-5` / `p-5` | 20px |
| 6 | `gap-6` / `p-6` | 24px |
| 8 | `gap-8` / `p-8` | 32px |

**禁用半档** `*.5`（2 / 6 / 10 / 14px）——如 `gap-2.5`、`gap-3.5`、`py-2.5`、
`gap-1.5`、`mt-1.5`、`py-1.5`、`mb-2.5`、`p-1.5`。

### 2.3 节奏：组内紧凑，组间留白（间距 = 内 + 外）

| 层级 | 值 | 例 |
| --- | --- | --- |
| 行内元素 | `gap-2`（8） | 图标 ↔ 标签 ↔ 尾部箭头 |
| 组内（同卡区块间） | `gap-3`（12） | 面板内 身份区/描述/芯片/CTA |
| 组间（卡与卡） | `gap-4`（16） | 数据条 ↔ 面板 |
| 板块间（页面级） | `gap-5`~`gap-6`（20~24） | 顶层分区 |

成对规则（**内间距 + 外间距**一起设计）：

- 容器内距 `p` ≥ 其外侧 `gap`（内容不贴边）：卡 `p-5`(20) ↔ 卡间 `gap-4`(16)；
- **外 gap > 内 gap**，组边界才分得出来：卡间 `gap-4`(16) > 卡内 `gap-3`(12)；
- 行元素：`px-4`(16) 内距 + `py-3`(12) 内距，行间由容器 `gap-3` 或分隔线承接。

### 2.4 已知倒置（欢迎页）

数据条↔面板 `gap-2.5`(10) **小于** 面板内区块 `gap-3.5`(14) —— 组间比组内
还挤，节奏倒置。修正方向：组间 `gap-4`(16)，组内 `gap-3`(12)。

---

## 3. 对齐（左缘默认）

- 同类元素（列表行、卡片列、菜单项、按钮组、表单项）**默认共享左边缘**：
  左缘 = 容器内距线，文字 `text-left`，图标起手位一致。
- 全宽按钮（CTA）的 **icon + label 同样靠左**——不居中；右侧留给箭头/辅助信息。
- 居中只允许出现在**无同类上下文**的场合：空状态、居中品牌区。
- 数值列右对齐 + `tabular-nums` 属排版例外（表格/数据格），不算破坏左缘。

---

## 4. 装饰与图标（做减法）

### 4.1 删除项

- ❌ 表情符号（全站文案已 0，保持）
- ❌ 感叹号（欢迎页文案已 0，保持；营销文案也不许）
- ❌ **装饰徽章**：如"开发中"胶囊——禁用态本身（`opacity-50` +
  `cursor-not-allowed` + `aria-disabled`）已足够表达，徽章是冗余装饰
- ❌ 无信息量的连续动画（无限 ping/bounce 光点作氛围）——连续动画只准
  用于**加载中**与**真实在线状态**，且同屏最多一处

### 4.2 图标：一套线性

- **图标库选型见 §7（2026-11-09 决定：Fluent → Lucide）**；换库前过渡期只用
  **Fluent Regular（线性）** 变体，`*_filled` 与 `filled` 属性一律不用
  （白名单内 13 个 `*_filled` 变体待 §7 S2 清除）。
- 图标名**必须**在 `Icon.tsx` 白名单：缺名会静默回退成 `tag` 图标
  （`Icon.tsx:217`），是隐性 bug（现存 `mail_inbox` 即此）。
- 同一语义全站同一图标：入口行/菜单行用同一枚（如"时间线"统一 `history`）。
- Astryx 组件内部图标（注册表兜底）必须与站内图标**同源**，禁止双风格并存
  （详见 §7 现状问题）。

---

## 5. 欢迎页审计（2026-11-09）

范围：`web/src/components/welcome/*`（Welcome / WelcomeBackground /
WelcomeActionPanel / WelcomeMenuItem / WelcomeStatusBar / welcomeConfig）。
桌面壁纸大字「Asagity 2026.Q4」不属于欢迎页组件，不在本次范围。

### 规则 1 — 色彩

| 判定 | 位置 | 证据 |
| :---: | --- | --- |
| ✅ | 面板/数据条 | `bg-sheet/95` + `text-fg`/`text-fgdim` 中性令牌 |
| ❌ | `WelcomeActionPanel.tsx:359` | 主 CTA `glow-accent glow-accent-hover`（发光，`globals.css:276-282` 20/30px accent 光晕） |
| ❌ | `WelcomeActionPanel.tsx:352` | `variant="primary"` 底为多层 `linear-gradient` 叠加（astryx `Button.js:186-192`） |
| ❌ | `WelcomeBackground.tsx:39-40` | 硬编码 `linear-gradient(135deg,#0a0a1a…)` fallback 渐变层 |
| ❌ | `WelcomeBackground.tsx:94` | 根容器 `bg-[#0a0a0f]` 硬编码，非中性令牌 |
| ⚠️ | `WelcomeActionPanel.tsx:28,259` | 在线数 `text-ok`——状态色例外，按 §1.3 保留但仅此 |
| ❌ | `WelcomeStatusBar.tsx:84-111` | `bg-emerald-400/red-400/gray-400`、`text-gray-*`、`shadow-[0_2px_8px…]`、手动 `isDark` 分支——原始色板 + 死代码（`StatusPills`/`WelcomeStatusBar` 已无消费方，仅 `useWelcomeStatusItems` hook 在用） |

### 规则 2 — 间距/圆角档位与节奏

| 判定 | 位置 | 现值 → 应为 |
| :---: | --- | --- |
| ❌ | `WelcomeActionPanel.tsx:268` logo 盒 | `rounded-xl p-1.5` → `rounded-lg p-1`（8/4） |
| ❌ | `:336` 时间线行 | `rounded-xl py-2.5` → `rounded-lg py-3`（8/12） |
| ❌ | `:245` 面板栈 | `gap-2.5`(10) → `gap-4`(16)（组间） |
| ❌ | `:264` 面板本体 | `gap-3.5`(14) → `gap-3`(12)（组内） |
| ❌ | `:351` CTA 组 | `gap-2.5`(10) → `gap-2`(8) |
| ❌ | `:315` 芯片 | `px-2.5 gap-1.5` → `px-2 gap-1`（8/4） |
| ❌ | `:377-378` 下拉菜单 | `mb-2.5 py-1.5` → `mb-2 py-1`（8/4） |
| ❌ | `WelcomeMenuItem.tsx:35` | `py-2.5`(10) → `py-3`(12)（大项）/`py-2`(8)（小项已合规） |
| ❌ | `WelcomeActionPanel.tsx:34` 数据格标签 | `mt-1.5`(6) → `mt-1`(4) |
| ✅ | 数据格/菜单行/面板内距 | `px-4 py-3`、`px-4`、`p-5`、`gap-3`、`rounded-3xl/2xl/lg` 合规 |

### 规则 3 — 左缘对齐

| 判定 | 位置 | 说明 |
| :---: | --- | --- |
| ✅ | 数据格/菜单项/时间线行/芯片流 | 均左对齐，左缘一致 |
| ❌ | `:352-368` CTA 按钮组 | astryx Button 文案**居中**，与面板各行左缘不齐 → 按 §3 靠左 |

### 规则 4 — 装饰与图标

| 判定 | 位置 | 说明 |
| :---: | --- | --- |
| ✅ | 四语言全库 | 表情符号 0、欢迎页感叹号 0 |
| ❌ | `welcomeConfig.ts:55,81,89,97,105,131` | 6 处"开发中"装饰徽章（`WelcomeMenuItem.tsx:41-45` 渲染 pill）→ 删徽章，保留禁用态 |
| ❌ | `WelcomeActionPanel.tsx:340` | `timeline_20_filled` 填充图标混入线性集 → 换 `history`（白名单已有，线性） |
| ❌ | `welcomeConfig.ts:101` | `mail_inbox` **不在白名单** → 静默降级成 `tag` 图标 → 改 `inbox` |
| ⚠️ | `:319` / `WelcomeStatusBar.tsx:93` | 无限 `animate-ping` 光点 ×2 → 同屏保留一处（心跳状态），其余静点 |
| ⚠️ | `WelcomeStatusBar.tsx` | `StatusPills` 组件为死代码 → 删除或按 §1 令牌化后复用 |

---

## 6. 设计改进清单（欢迎页）

### P0 — 正确性 / 违反铁律
1. `welcomeConfig.ts:101` `mail_inbox` → `inbox`（现为静默错误图标）。
2. 主 CTA 去发光去渐变：删 `glow-accent glow-accent-hover`
   （`WelcomeActionPanel.tsx:359`），按钮改 inverted 中性实底
   （`bg-invert` + 高对比反字，§1.2）——由 astryx `primary`（渐变）改
   `secondary`/自定类，保证一屏一个主操作。
3. `WelcomeActionPanel.tsx:340` `timeline_20_filled` → `history`（线性统一）。

### P1 — 档位 / 节奏 / 对齐
4. 按 §2.4 表逐项归档位：栈 `gap-4`、面板 `gap-3`、CTA `gap-2`、logo 盒
   `rounded-lg p-1`、时间线行 `rounded-lg py-3`、芯片 `px-2 gap-1`、菜单
   `mb-2 py-1`、菜单大项 `py-3`、数据格标签 `mt-1`。
5. CTA 文案左对齐（icon+label 共享面板左缘，§3）。
6. `WelcomeBackground` fallback 渐变层删除 → 中性纯色（`background-body`
   令牌）；根容器 `bg-[#0a0a0f]` 换令牌。
7. 删除 6 处"开发中"徽章（`welcomeConfig` 的 `badgeKey` 通路 +
   `WelcomeMenuItem` pill 渲染），禁用态保留。

### P2 — 减法与清理
8. `animate-ping` 同屏收敛为一处（面板心跳芯片），StatusBar 死点删除。
9. `WelcomeStatusBar.tsx` 死代码：删除 `StatusPills`/`WelcomeStatusBar`
   导出（hook 保留）；若保留则改语义令牌 + 去手动 `isDark`。
10. 全局延伸（欢迎页外，另行排期）：`glow-accent` 其余 5 处
    （`LoginPage.tsx:205`、`RegisterPage.tsx:442/572/639`、
    `TermityAuthModal.tsx:262`）与 `DESIGN.md` 过时段落对齐（§8）；
    图标库迁移按 §7 三步执行（S1 换 Lucide → S2 清 filled → S3 注册表接管）。

---

## 7. 图标库选型与执行方案（2026-11-09 决定：更换 → Lucide）

### 7.1 调研结论：Astryx 没有"官方图标库"

| 事实 | 证据 |
| --- | --- |
| npm 无独立图标包 | `@astryxdesign/icons` / `astryx-icon` 等全部 404；官方全家桶只有 core / cli / build / theme-\* |
| 官方架构 = 注册表制 | `Icon` 组件 + 30 个语义名（`close`/`chevronDown`/`search`…）+ ~1.4KB 兜底 SVG；源码注释："Themes should override these with higher-quality icons from a proper icon library (**heroicons, lucide**, Material Symbols)" |
| 官方主题全线用 Lucide | 7 个官方主题包 keywords 均含 `lucide`；`theme-neutral` 直接依赖 `lucide-react@^1.18.0`；core README 标注 "(Lucide icons)" |
| 官方 CLI 文档明示 | `astryx docs icons`：`theme-overrides` 支持 "swap the icon set (e.g. heroicons → lucide) **without touching component code**"；`custom-icons` 示例直接 `import { HeartIcon } from 'lucide-react'` |

→ 议题实质：**Fluent UI Icons（现状） vs Lucide（Astryx 生态默认路线）**。

### 7.2 对比

| 维度 | Fluent UI Icons（现状） | Lucide（Astryx 路线） |
| --- | --- | --- |
| 官方供给 | ✅ 独立包 `@fluentui/react-icons@2.0.345`，数千图标 | ❌ 无独立包；语义名仅 30 个，其余直接传组件 |
| 线性统一 | ❌ filled 变体混入（白名单 13 个 `*_filled`） | ✅ 纯 stroke 线性，**结构上不可能违规** |
| 风格契合 | Fluent 微软风格 | 中性 stroke-2，配 Glacier 中性基准 + HarmonyOS Sans |
| 覆盖在用 113 个语义名 | ✅ 现成 | ✅ 抽查 69/69 语义全命中（lucide 全集 2317 枚） |
| 迁移成本 | 0 | 被架构吸收：全站 372 处 `<Icon>` 均走 `Icon.tsx` 单文件，只改 `iconMap` 映射 |
| 依赖 | 已装 | 已在 pnpm 传递依赖树（1.69），需 `pnpm add` 提为直接依赖 |

**现状额外问题（双风格并存）**：Astryx 组件内部（如 `Link` 外链默认的
`externalLink`）渲染注册表兜底 SVG（heroicons 风格 stroke 1.5），与我们的
Fluent 图标同屏两套线性语言——直接违反铁律 4。项目从未 `registerIcons`，
Astryx 内部图标全是 30 个兜底。

### 7.3 决策：更换到 Lucide（理由按权重）

1. **迁移成本被 `Icon.tsx` 单文件架构吸收**——372 处调用零改动，只重写 101 条 `iconMap` 映射。
2. **铁律 4 结构性清零**——Lucide 没有 filled 变体，13 个 filled 混入连根消失，无需逐个手工删。
3. **真正"一套线性"**——与 Astryx 组件内部图标统一到同一视觉语言，顺手 `registerIcons` 覆盖兜底。
4. **官方生态对齐**——Astryx 主题/文档/示例全按 Lucide 设计，后续换季、升版顺滑。

**代价（诚实记录）**：101 条映射重写 + 全站视觉回归（Playwright 截图 QA）；
少数 Material 命名图标（`timeline_20_filled`、`mail_inbox`、`sports_esports`
等）需人工选型。

**若保持不变的代价**：filled 变体逐个手工清理、双风格并存延续、
后续每个带内部图标的 Astryx 组件都要手工喂图标。

### 7.4 执行方案（三步）

| 步骤 | 内容 | 验证 |
| --- | --- | --- |
| **S1 换库** ✅ | `pnpm add lucide-react`；重写 `src/components/ui/Icon.tsx` 的 `iconMap`（101 条映射，**`name` 键全部不动** → 372 处调用零改动）；逐名核对语义 | `tsc --noEmit` + `vitest run` + `vite build` |
| **S2 清 filled** | 删 13 个 `*_filled` 白名单条目与 `filled` 属性通路；`Icon.tsx:217` 缺名回退问题一并复核（`mail_inbox` → `inbox` 即原 P0-1） | 同上 + 全仓 `grep` 无 `filled` 残留 |
| **S3 接管注册表** | 应用入口 `registerIcons(...)` 用 Lucide 覆盖 Astryx 30 个语义名兜底，终结 `Link` 外链等处的双风格；Astryx 组件 `icon` prop 直接传 Lucide 组件 | Playwright 全页截图回归（浅/深），确认同屏单一线性语言 |

**S1 执行记录（2026-11-09 完成）**：
- `lucide-react@1.70.0` 提为直接依赖；`@fluentui/react-icons` 已移除，全仓零残留。
- `Icon.tsx` 101 个语义 key 全保留、值全换 Lucide；`filled` 通路按计划留作兼容垫片（S2 删）。
- 验证全绿：`tsc --noEmit` **0 错误**（连 4 个历史遗留也清零）、`vitest` **65/65**、`vite build` ✓ 1.86s。
- Playwright 截图回归 5 张（欢迎明/暗、更多菜单明/暗、登录明）：图标全部线性渲染、明暗双面正常、
  无渲染/控制台异常（仅预期的 backend offline 502）；截图存 `/tmp/opencode/icon-qa/`。
- 附带达成：`timeline_20_filled` 现解析为线性 `History`（原 P0-3 视觉已修，config 改名可并入 P0）。

- **顺序**：S1 → S2 → S3，每步独立提交、独立验证；S1 与欢迎页 P0 清单
  （`mail_inbox`、CTA、`timeline_20_filled`）可并行，互不阻塞。
- **回归范围**：欢迎页、登录/注册、系统信息窗口等所有含 `<Icon>` 的界面
  （脚本基线见 `/tmp/opencode/sysinfo-qa/`，端口仅用 2001）。
- **回滚**：改动收敛在 `Icon.tsx` 单文件 + 入口一行 `registerIcons`，
  git 单点回滚即可。

---

## 8. 与既有文档的关系

| 文档 | 关系 |
| --- | --- |
| `design-tokens.md` | 季节色板与语义 token 的**事实源**，本文不重复数值 |
| `DESIGN.md` | 历史规范（2026-07-13 存档）。其中 **该文档 §5 Shadows & Glows 的
  Glow 行、该文档 §8 Button Primary 渐变行、该文档 §1 "glows/Decorative sparkles" 用途**
  与本文冲突，以本文为准（已在该文档顶部加废除提示） |
| 本文 | 页面级设计的**规范性条文**；新页面先过 §0 四条铁律再评审；图标库迁移走 §7 三步 |

---

*Asagity Design Standard v2 · Neutral Baseline — 2026-11-09（§7 图标选型：Fluent → Lucide）*
