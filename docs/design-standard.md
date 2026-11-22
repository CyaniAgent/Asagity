# Asagity 界面设计规范 — v2「中性基准（Neutral Baseline）」

> 状态：**2026-11-09 制定，欢迎页首审完成（§5 审计 / §6 改进清单）；
> 图标库选型完成（§7，决定 Fluent → Lucide）；
> 系统信息窗口：方案见 §9（2026-11-20），第一圈（§9.5）与第二圈（§9.6）已修复并验证；
> 圆角按用户要求回退、F009 组件化完成（§9.7）；
> 「Asagity 信息」卡片重构 + 页脚完成（§9.8）；
> 页脚字号统一 + 服务端版本分组修复（§9.9）；
> 项目组织者改为 4 条透明响应式 Grid（§9.10）；
> 「Asagity」英雄区重建为手机系统设置式（§9.11），并按用户反馈简化为照片直排（§9.12），
> 补文字投影 / 去图标 / 图片禁右键（§9.13）；
> 自由窗口活跃机制 + 真全屏修复（§9.14）**
> 适用范围：欢迎页及后续所有页面。规范性条文以本文为准；季节色值仍以
> [`design-tokens.md`](./design-tokens.md) 为准；[`DESIGN.md`](./DESIGN.md) 中
> §5 Glows、§8 渐变按钮等与本文冲突的条目**废除**（见 §8）。

---

## 0. TL;DR — 四条铁律

1. **色彩受控**：正文/容器底与文字默认只用中性令牌；主要操作靠**主题 accent
   实底**（或明暗对比 inverted）突出；**取消一切渐变，不发光**。
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

**正文/容器底与文字一律中性**；主题色底仅限**主操作按钮**（§1.2）与状态色
（§1.3），不得为"好看"给正文/容器上主题色底或彩色文字。

### 1.2 主要操作 = 主题 accent 实底（inverted 为可选）

- **Primary CTA**：优先 `bg-brand` + `text-onbrand`（Glacier accent 实底 + 反字：
  明 `#2E76B8`/白字 4.8:1，暗 `#7FC9F0`/深冰字），hover 走 `bg-branddeep`；
  也可用 `bg-invert` + `text-plate` 中性反转面。**无渐变、无发光**。
- 一屏只允许一个主操作实底按钮；次要操作用 `bg-sheet`/描边/ghost，靠
  **明暗层级与是否实底**区分主次。
- `accent`（Glacier 蓝）用途：**主操作实底、链接、焦点环、选中态**——不作
  正文色，不作渐变端，不作大面积容器底。

> **修订（2026-11-14）**：主 CTA 由"inverted 中性实底"改为**优先 accent 实底**，
> 与 `design-tokens.md` §3（`--color-accent` 用途含"按钮"）对齐。欢迎页
> "加入实例"已落地；原 P0-2 的 inverted 结论作废（见 §6）。

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
| ❌ | `:377-378` 下拉菜单（2026-11-14 移至触发钮 wrapper `:340`/`:360`） | `mb-2.5 py-1.5` → `mb-2 py-1`（8/4） |
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

> **执行状态（2026-11-09 制定，2026-11-14 全部收口）**：P0 1–3 ✅ / P1 4–7 ✅ /
> P2 8–10 ✅ 全部落地；P2-10 于 2026-11-14 完成（欢迎页外 `glow-accent` 5 处删除 +
> `DESIGN.md` 过时段落对齐）；图标库迁移 §7 三步（S1/S2/S3）亦全部完成。

### P0 — 正确性 / 违反铁律
1. `welcomeConfig.ts:101` `mail_inbox` → `inbox`（现为静默错误图标）。
2. 主 CTA 去发光去渐变：删 `glow-accent glow-accent-hover`
   （`WelcomeActionPanel.tsx:359`），按钮改自定实底——由 astryx `primary`
   （渐变）改 `secondary`/自定类，保证一屏一个主操作。
   ⚠️ **2026-11-14 修订**：实底取色由 inverted 中性改为 **accent 实底**
   （`bg-brand`/`text-onbrand`，§1.2），原 inverted 结论作废。
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
10. ✅ 全局延伸（欢迎页外，**2026-11-14 完成**）：`glow-accent` 其余 5 处
    （`LoginPage.tsx:205`、`RegisterPage.tsx:442/572/639`、
    `TermityAuthModal.tsx:262`）已删——这 5 处也是全仓仅有的
    `variant="primary"` 用点，实测其底已为 accent 纯色（`#2E76B8`，无渐变），
    故只删发光即可归档；`.glow-accent` 工具类与 `SplashScreen` 过时注释
    一并清除。`DESIGN.md` 过时段落对齐（§8）：顶部废除提示更新为
    "accent 实底"，§1 用途表 / §5 Glow 行 / §8 Primary 渐变行就地加 ❌ 标记。
    图标库迁移 §7 三步（S1 换 Lucide → S2 清 filled → S3 注册表接管）已完成。

### 追加 · 更多菜单弹出位置与收起动画（2026-11-14 完成）

锚点由外层 stack 容器迁移至**触发钮 wrapper**（`WelcomeActionPanel.tsx:340`），
菜单不再悬在数据条上沿之外，改为紧贴触发钮弹出：

- **设计定律依据**（联网一手资料）：Fitts 定律（触发钮→菜单 D 距离
  ~90px → **8.00px**）、Gestalt 邻近律（菜单视觉归属触发钮而非整个面板）、
  W3C APG menu-button（a11y 基线：aria-haspopup/expanded/controls、
  ↑↓/Home/End/Esc、焦点归还——原样保留）、MDN `@starting-style`/exit
  动画模式（本实现取 React 双状态 + `animationend` 路线，兼容性无要求）。
- **位置**：`top-full mt-2 right-0`——右缘与触发钮对齐（§0 铁律三）、
  间距 8px（§2.3 4px 网格）；默认向下弹，下方空间 <160px 且上方更宽裕时
  自动上翻（`bottom-full mb-2`），并按可用空间限高内滚（4px 网格取整）。
  wrapper 加 `flex` 消灭 inline 行盒 descender 空隙，保证 gap 恰为 8px。
- **动画**：入场 `menu-pop` / 收起 `menu-pop-out`（150ms `--ease-standard`，
  §1 时长档）；起始位移经 `--menu-pop-shift` 随弹出方向切换、origin 经
  Tailwind `origin-*` 随翻转切换（下=从钮下缘冒出 / 上翻=从钮上缘冒出，
  运动方向与生长方向自洽）。关闭时保持挂载跑退场 → `animationend` 卸载；
  reduced-motion 走瞬时 `opacity:0` + 240ms 兜底定时器；收起期间
  `inert` + `pointer-events-none`（防焦点/点击打进淡出层）。
  触发钮 wrapper 键盘处理器加 `e.target` 守卫——菜单移入 wrapper 后
  菜单按键会冒泡，只处理触发钮自身的按键（并新增"已开时 ↑↓ 直接送焦进菜单"）。
- **验证（2026-11-14）**：`tsc --noEmit` 0 / `vitest` **67/67** /
  `vite build` ✓；Playwright 文本断言两轮 **ALL PASS**：
  明/暗 gap=8.00、右缘 0 偏差、origin `224px 0px`（right top）、
  入/退场动画类与 0.15s 时长、t+0 保持挂载 + `inert` + aria-expanded=false、
  ~200ms 由 animationend 卸载、Esc 焦点归还、菜单内 ↑↓ 不误触 wrapper 开合、
  菜单项点击走退场、reduced-motion 卸载路径、控制台 0 非预期错误。

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
| **S2 清 filled** ✅ | 删 13 个 `*_filled` 白名单条目与 `filled` 属性通路；`Icon.tsx:217` 缺名回退问题一并复核（`mail_inbox` → `inbox` 即原 P0-1） | 同上 + 全仓 `grep` 无 `filled` 残留 |
| **S3 接管注册表** ✅ | 主题 `defineTheme({ icons })` 用 Lucide 覆盖 Astryx 30 个语义名兜底（Astryx 官方推荐路径，global `registerIcons` 会 dev 告警，故不采用）；Astryx 组件 `icon` prop 本就直传 Lucide 组件 | `tsc` + `vitest`（含 30 键覆盖与 built 产物管线测试）+ `vite build` + Playwright 截图回归（浅/深） |

**S1 执行记录（2026-11-09 完成）**：
- `lucide-react@1.70.0` 提为直接依赖；`@fluentui/react-icons` 已移除，全仓零残留。
- `Icon.tsx` 101 个语义 key 全保留、值全换 Lucide；`filled` 通路按计划留作兼容垫片（S2 删）。
- 验证全绿：`tsc --noEmit` **0 错误**（连 4 个历史遗留也清零）、`vitest` **65/65**、`vite build` ✓ 1.86s。
- Playwright 截图回归 5 张（欢迎明/暗、更多菜单明/暗、登录明）：图标全部线性渲染、明暗双面正常、
  无渲染/控制台异常（仅预期的 backend offline 502）；截图存 `/tmp/opencode/icon-qa/`。
- 附带达成：`timeline_20_filled` 现解析为线性 `History`（原 P0-3 视觉已修，config 改名可并入 P0）。

**S2 执行记录（2026-11-09 完成，与欢迎页 P0/P1/P2 同批）**：
- `Icon.tsx`：删 13 个 `*_filled` key、`filled` prop、baseName fallback——回退收敛为
  `iconMap[name] || iconMap["tag"]`；S1 的兼容垫片使命完成。key 总数 101 → 88。
- 改名：`mail_inbox` → `inbox`（P0-1，原解析为错误图标）、`timeline_20_filled` → `history`（P0-3）、
  `chart_multiple_16_filled` → `chart_multiple`（`NotificationCenter` 同步）。
- 欢迎页 P0/P1/P2 同批落地：CTA 换原生 inverted/neutral 实底（去 glow、左对齐、一屏一主）、
  间距/圆角全归档位（栈 gap-4 / 面板 gap-3 / CTA gap-2 / 圆角 4-8-16-24）、
  `badgeKey` 通路与 pill 徽章删除（禁用态保留）、`WelcomeBackground` fallback 渐变 → `background-body` 纯色、
  `WelcomeStatusBar` 死组件删除（hook 保留）。
- 验证全绿：`tsc --noEmit` **0 错误**、`vitest` **64/64**（−1 删除的 filled 用例）、`vite build` ✓ 1.39s；
  全仓 grep `_filled` / `filled=` / `badgeKey` / 违规间距均为 0 残留。
- Playwright 截图回归 5 张（欢迎明/暗、菜单明/暗、登录明）：CTA inverted 明=深底白字 / 暗=白底深字、
  徽章消失、菜单"联系我们"显示正确 Inbox、非 502 控制台错误 0；截图存 `/tmp/opencode/icon-qa/`。

**S3 执行记录（2026-11-11 完成）**：
- 落点改为**主题级**：`src/theme/yukinoshita-glacier/icons.ts` 导出 `yukinoshitaGlacierIcons`
  （30 键 = Astryx `defaultIcons` 全集：29 个 `IconName` + `numberInput:stepperDown` 扩展键），
  主题源 `defineTheme({ icons })` 引用。原计划的应用入口 `registerIcons` 实测触发 Astryx dev 告警
  （"Prefer defineTheme({ icons })"），上游明确推荐主题级——且换季换主题时图标随主题一并交接。
- CLI 构建管线三个坑（均已解决并写入主题源注释）：
  1. theme 构建的 jiti 加载器不认 `@/` 别名 → 图标模块用相对路径 `./icons` 导入；
  2. jiti 经典 JSX 转译报 `React is not defined` → 注册表用 `createElement` 而非 JSX；
  3. built `.js` 落在 `dist/` 而 `./icons` 按源目录解析 → 构建必须带
     `--icons-specifier '../icons'`（已烘入 `package.json` 的 `theme:build` script）。
- 测试（`src/theme/yukinoshita-glacier/__tests__/icons.test.tsx`，3 用例）：30 键全覆盖、
  **直接消费 built dist 产物**断言 `getIcon(key, theme)` 命中注册表（锁住构建管线不回退）、
  glyph 渲染为 1em/aria-hidden 的 Lucide svg。
- 验证全绿：`tsc --noEmit` **0 错误**、`vitest` **67/67**、`vite build` ✓ 3.06s、
  `pnpm theme:build` ✓（126 token overrides，产物 `import ... from "../icons"` + `icons:` 挂载正确）。
- Playwright 回归 5 张（明暗欢迎页/菜单 + 登录）：**icon 相关 console.warn = 0**（registerIcons 告警消失）、
  欢迎页 4 张与 S3 前指纹完全一致（像素级零回归）、非 502 错误仅预期 backend offline ×3；2001 已清理。
- 现状盘点：Astryx 注册表现存消费方（Chat/Avatar/MoreMenu/Collapsible/Link 外链）当前均未在应用中
  渲染——接管属**结构性防御**：未来任何 Astryx 组件接入即自动获得 Lucide artwork，无双风格窗口期。

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
| 本文 | 页面级设计的**规范性条文**；新页面先过 §0 四条铁律再评审；图标库迁移走 §7 三步；页面审查方案见 §9 |

---

## 9. 系统信息窗口设计审查方案（2026-11-20 提出，待实施）

### 9.1 范围与结论

对自由窗口 `viewType=system_info`（760×660，明暗双面）做**只读**设计审查，未改代码。
渲染实测 + Astryx 官方 Design Conventions（wiki）+ 独立子代理源码一致性审查三路交叉：

- **Design Score C+ / AI Slop Score C**，共 11 条发现（4 high / 6 medium / 1 polish）。
- 截图与基线：`~/.gstack/projects/asagity/designs/design-audit-20261119/`。
- Codex 本机不可用，按 single-model 记录；子代理发现以 `[subagent]` 标注。
- 做对的部分必须保留：冰河照片 + `Yukinoshita Glacier · 2026.Q4` 的季节指纹、
  左标签右值的干净键值表、真实 build/版本数据、无 emoji 无彩色左边框。

**依据**：Astryx 官方 *Design Conventions*（token purity、4px grid、同心圆角
`r_inner = r_outer − gap`、elevation 层级、状态必须颜色+图标配对、AI tells：
decorative blobs / colored glow / nested cards / off-role sizing）；本文 §0 四条铁律、
§1.4 禁用清单、§2 间距圆角档位；`design-tokens.md` §3/§4（Glacier/Frost/Aurora/Periwinkle、
base 14 × 1.2 字阶、150ms `--ease-standard`）。

> Astryx 官方允许 2px 光学半档，但本项目 v2 标准禁用 `*.5`，**从严按本文执行**。

### 9.2 发现清单（按落点）

| ID | 级别 | 落点 | 问题 |
| --- | --- | --- | --- |
| F001 | high | `SystemInfoContent.tsx:250,235,238,244,369,376` | 150px/300 巨型 `204` 与 26px build 文案重复同一事实；periwinkle 径向 blur blob、`from-black/65` 渐变遮罩、空状态渐变 + shimmer |
| F002 | high | `SystemInfoContent.tsx:92,260` | 3 处 `shadow-[0_0_6/8px_var(--color-accent)]` 彩色发光（P2-10 只删了 `glow-accent` 类，arbitrary shadow 漏网） |
| F003 | high | `FreeWindow.tsx:322`；`WindowHeader.tsx:107,114,126,137,148,159,166,171`；`WindowManager.tsx:102,104–114,136,138,148,195` `[subagent]` | 窗壳 raw `bg-white/90 dark:bg-gray-900/90`、`border-gray-*`、`text-gray-*`、手写 `dark:` 分支；暗面成灰蓝而非赛季「冰下」`#001F2F` |
| F004 | high | `SystemInfoContent.tsx:39,73,76,100,101,263,267,321,250`；`WindowHeader.tsx:114` | 4 个 H2 全为 `text-[11px] font-black tracking-[0.14em]`；12.5px 与 150px/300 off-scale；13/14/15px 相邻档挤压 |
| F005 | high | `SystemInfoContent.tsx:72,98,311,333,99,119,258`；`WindowHeader.tsx:107,121,166`；`FreeWindow.tsx:322` | `py-2.5`/`gap-2.5`/`gap-3.5`/`px-3.5`/`mt-[7px]` 半档与任意值；`rounded-xl`(12) 禁用档；窗口 16px 而赛季 `rounded-freewin`(30) 未用 |
| F006 | medium | 内容区结构 | 外层卡内再套 Go/.NET 蓝色小卡 + 组织链接卡，嵌套卡违反 Astryx 间距异味 |
| F007 | medium | `SystemInfoContent.tsx:365–391` | 「特别鸣谢 / 正在筹备，敬请期待」居中渐变 placeholder；`org-members` 404 时暗面只剩裸标题 |
| F008 | medium | `WindowHeader.tsx:171` | 关闭按钮 `text-gray-400` 对白底 **2.54:1**，低于 WCAG UI 组件 3:1 |
| F009 | polish | 全页 | 手写 `div`/`span` + arbitrary CSS，未走 Astryx `Card`/`Heading`/`Text`/`Divider`/`EmptyState` |
| F010 | medium | `WindowHeader.tsx:137,171`；`EmptyState.tsx:24–28`；`ConnectionPill.tsx:18`/`NetworkStatus.tsx:49`/`MainLayout.tsx:233` `[subagent]` | indigo hover 不在 Glacier ramp；`hover:bg-red-500` 把危险色当普通填充；共享 `EmptyState` 零消费且自身 raw 灰阶；在线/离线状态色多套并存 |
| F011 | medium | `SystemInfoContent.tsx:23,333,376`；`FreeWindow.tsx:223–228` `[subagent]` | 三套缓动（自定义 `EASE=[0.22,1,0.36,1]` / `--ease-standard` / 外壳 `(0.4,0,1,1)` 等）+ 装饰性 shimmer 与头像堆 |

### 9.3 解决方案（三步，按收益排序）

**第一步 · 守铁律，去 AI 味（最高收益，改动最小）**

1. 删 F001 的巨型数字、径向光斑、空状态渐变与 shimmer；build 文案保留为唯一焦点。
   照片压暗不要直接删（白字需要对比度），改为**新增赛季 scrim token**（半透明冰下色）替代 `from-black/65`。
2. 删 F002 的 3 处 arbitrary glow：竖条改纯 `bg-brand` 无光；Go/.NET 圆点改线性 Icon 或 `bg-fgdim`。
3. raw 色统一换语义 token：`bg-white/90 dark:bg-gray-900/90` → `bg-sheet`/`bg-popover`；
   `border-gray-*` → `border-line`；`text-gray-800/500/400` → `text-fg`/`text-fgdim`；
   `hover:bg-red-500` → token 化 `bg-bad/10` + `text-bad`；indigo hover → `text-branddeep`/`text-fgaccent`。
   删除手写 `dark:` 分支，交给令牌的 `light-dark()`。
4. 间距圆角归档：14→12/16、6→8、10→8/12、`mt-[7px]`→`mt-2`、`rounded-xl`→`rounded-lg/2xl`；
   外壳 `rounded-2xl` → `rounded-freewin`，header 顶角同值。

**第二步 · 重建层级（按 Astryx 官方约定）**

- Hero 只留一个焦点：build 文案（20px/600）+ 季节 codename 作 supporting text；照片是氛围不是信息。
- 4 个 H2 → 13px/600/字距 normal；版本值 → 14px/500；删 12.5px、150px、font-black、
  `tracking-[0.14em]`；Quicksand 随巨型数字一起退役。
- 删嵌套卡（F006）：外层容器内用 `Divider` + 行内 Icon 分组；组织链接降级为普通可点行。
- 状态统一（F007/F010）：错误态给「Icon + 文案 + 重试」，无内容的「特别鸣谢」直接不渲染；
  共享 `EmptyState` 先令牌化再复用；状态色一律 token + Icon 配对。

**第三步 · 赛季精细化**

- 明版雪原/冰面玻璃：面 `#EDF1F6`/`#FFFFFF`、冰纹线 `#00325C1A`、accent `#2E76B8`；
  暗版冰下：面 `#001421`/`#001F2F`、文字 `#DEE3E9`/`#8A9299`、accent `#7FC9F0`。
- Periwinkle 仅作话题/引用点缀，不做背景光斑；冰河照片保留但降低饱和度 + token 化 scrim。
- 动效统一 `--ease-standard` 150ms，只保留一次有语义的 stagger 入场；
  `prefers-reduced-motion` 降级；删 shimmer 与其他装饰性 motion（F011）。

### 9.4 验收标准（转修复任务时逐条勾选）

| 项 | 标准 |
| --- | --- |
| 静态残留 | `SystemInfoContent.tsx` / `FreeWindow.tsx` / `WindowHeader.tsx` / `WindowManager.tsx` 中 `shadow-[0_0_*]`、`blur-3xl` blob、`linear-gradient`/`radial-gradient`、`text-gray-*`、`bg-white/90`、`border-gray-*`、`rounded-xl`、`text-[12.5px]`、`text-[150px]`、`font-black`、`tracking-[0.14em]` 全部为 0 |
| 字阶字重 | 计算值字号 ⊆ {12,13,14,16,20,24}，字重 ⊆ {400,500,600,700}，字距 ≤0.05em |
| 间距圆角 | gap/padding ∈ 4/8/12/16/20/24/32；圆角 ∈ {4,8,16,24,30} |
| 对比度 | 关闭按钮 ≥3:1（gray-500 实测 4.83:1、`text-fgdim` 6.48:1）；正文 ≥4.5:1；明暗双面均需满足 |
| 状态与 a11y | 错误/空态有 Icon + 文案 + 可操作项；状态不靠颜色单独编码；焦点可见 |
| 动效 | 仅 transform/opacity；统一 `--ease-standard`；减动效降级；无装饰性连续动画 |
| 验证 | Playwright 明暗双面的计算值断言 + 前后截图；`tsc --noEmit` 0 / `vitest run` 全绿 / `vite build` ✓；每个修复独立提交 |

**状态**：方案已提出，按 §9.5 分圈实施。修复任务按顺序转成提交，逐条回填执行记录。

### 9.5 执行记录 · 第一圈（2026-11-20 完成，未提交）

**范围**：只改 `web/src/components/system/SystemInfoContent.tsx`，共享外壳未动（第二圈）。
按用户要求，提交由用户自行完成，本轮未执行任何 `git commit`。

| Finding | 处置 | 落点 |
| --- | --- | --- |
| F001 ✅ | 删 150px `204`、periwinkle blur blob、`from-black/65` 渐变压暗、空状态渐变 + shimmer；build 文案改放 `bg-sheet/80 backdrop-blur-glasslight` 磨砂带，`text-fg` 随明暗令牌解析（用 token 化磨砂带替代新增 scrim token，保持第一圈只碰单文件） | Hero Banner |
| F002 ✅ | 删 3 处 `shadow-[0_0_6/8px_var(--color-accent)]`；brand 短划线与运行行圆点无辉光 | `RuntimeRow` / Hero |
| F004 ✅ | 4 个 H2 → 13px/600/正常字距；标签 11px→12px、值 13px→14px、运行时值 12.5px→12px、组织名 15px→14px、build 26px→20px；Quicksand 退役（字族降至 2） | 全页 |
| F005 ✅ | `py-2.5`/`gap-2.5`/`gap-3.5`/`px-3.5`/`py-0.5`/`gap-1.5`/`mt-[7px]`/`h-[24px]`/`w-[2px]` → 4px 档；`rounded-xl`→`rounded-lg`；`-space-x-2.5`→`-space-x-2`；头像 ring 用 `ring-plate` | 全页 |
| F006 ✅ | Go/.NET 去掉内层卡底与描边，改 hairline 分隔行；组织行去掉第二层卡，平铺 + `hover:bg-fg/5` | 规格表 / 组织区 |
| F007 ✅ | 无内容的「特别鸣谢」整段不渲染（渐变 + shimmer + placeholder 一并消失）；组织数据失败仍由组织行兜底 + `—` | 页尾 |
| F011（本文件部分）✅ | `EASE` → `[0.2,0.8,0.2,1]`（`--ease-standard`）；删图片 `scale(1.04)` 装饰入场与头像 `hover:scale-110`；只保留 3 段有语义的 stagger 入场，reduced-motion 降级 | 动效 |

**验证（2026-11-20）**：

- `tsc --noEmit` **0 错误** / `vitest run` **67/67** / `vite build` ✓ 4.65s。
- Playwright 明暗双面 **28/28 断言 ALL PASS**（本文件作用域）：0 glow、0 gradient、
  无 150px 数字、0 Quicksand、H2 全 13px/600/normal、无 12px 圆角、
  无 6/10/14px 间距、无 placeholder 鸣谢、0 inline background、
  磨砂带走 token 且无渐变、组织行无卡描边、字族仅 2、内容仍渲染、0 非预期控制台错误。
- 明/暗前后截图：`screenshots/sysinfo-{light,dark}-before.png` →
  `screenshots/sysinfo-{light,dark}-after.png`（同目录 `design-audit-20261119/`）。
- 分类：**verified**（无 revert，无新增控制台错误）。

**仍待实施**：F003 / F008 / F010 / F011 的共享外壳部分已在 §9.6 完成；F009 组件化为第三圈。

### 9.6 执行记录 · 第二圈共享外壳（2026-11-20 完成，未提交）

**范围**：`FreeWindow.tsx` / `WindowHeader.tsx` / `WindowManager.tsx` / `SplitView.tsx` /
`EmptyState.tsx`（后两者为共享件）。共享改动波及所有自由窗口，故做跨窗口回归。
按用户要求未执行任何 `git commit`。

| Finding | 处置 | 落点 |
| --- | --- | --- |
| F003 ✅ | 窗壳 `bg-white/90 dark:bg-gray-900/90` → `bg-sheet/90`；`border-gray-*` → `border-line`；`backdrop-blur-3xl` → `backdrop-blur-glassheavy`；`shadow-[0_10px_40px_rgba(...)]` → `shadow-2xl`。暗面由灰蓝回到赛季「冰下」`oklab(0.2259 -0.0274 -0.0394 / 0.9)` | `FreeWindow.tsx:322` |
| F003/F010 ✅ | 标题栏 + 按钮全令牌：`text-gray-800/500/400` → `text-fg`/`text-fgdim`，`hover:bg-black/5 dark:hover:bg-white/10` → `hover:bg-fg/5`，indigo hover → `hover:text-branddeep`，`hover:bg-red-500` → `hover:text-bad hover:bg-bad/10`；删全部手写 `dark:` 分支 | `WindowHeader.tsx:107–171` |
| F005 ✅ | 窗口 `rounded-2xl` → `rounded-freewin`(30px)、header `rounded-t-2xl` → `rounded-t-freewin`；SplitView `rounded-[30px]` → `rounded-freewin`；`py-1.5`/`gap-1.5`/`h-3.5`/`mx-0.5`/`w-1.5 mx-1.5` 全归 4px 档 | `FreeWindow` / `WindowHeader` / `SplitView` |
| F008 ✅ | 关闭钮 `text-gray-400`(2.54:1) → `text-fgdim`，明 6.48:1 / 暗 5.38:1，过 WCAG UI 3:1 | `WindowHeader.tsx:171` |
| F010 ✅ | `WindowManager` 占位文案 raw 灰/红 → `text-fgdim`/`text-bad`；`EmptyState` raw 灰阶 + `font-black` → `bg-fg/5`/`text-fgdim`/13px-600 令牌（当前零消费，先令牌化备用） | `WindowManager.tsx:102–195`、`EmptyState.tsx:23–28` |
| F011 ✅ | 三套缓动收敛到 `--ease-standard`：FreeWindow 内联 transition 用 `var(--ease-standard, cubic-bezier(.2,.8,.2,1))`（closing/restore/maximize/open 四态）；SplitView `ease-[cubic-bezier(0.4,0,0.2,1)]` → `ease-[var(--ease-standard)]` | `FreeWindow.tsx:221–229`、`SplitView.tsx:57,80` |

**验证（2026-11-20）**：

- `tsc --noEmit` **0 错误** / `vitest run` **67/67** / `vite build` ✓ 11.51s。
- 5 个改动文件 raw 色/半档/旧缓动残留 grep **0**。
- Playwright 跨窗口回归：系统信息 / 时间线 / 登录窗口 × 明暗双面，**58/58 断言 ALL PASS**：
  窗口与标题栏圆角均 30px、标题 14px/500/正常字距、分割线 16px、
  关闭钮 token 色（明 `rgb(87,95,104)` / 暗 `rgb(138,146,153)`）、
  窗壳走 surface token（无 gray-900）、transition 缓动解析为
  `cubic-bezier(0.2, 0.8, 0.2, 1)`、内容仍渲染、0 非预期控制台错误。
- 截图：`screenshots/sysinfo-{light,dark}-shell-after.png`。
- 分类：**verified**，无 revert。
- 诚实标注：SplitView 需登录态布局，本轮仅做源码 grep + 编译验证，未做浏览器实测；
  `/api/shell/github/org-members` 与 `/api/meta/version` 后端离线返回 404，
  内容显示 `—`，属预期数据行为非回归。

**仍待实施**：无。F009 组件化见 §9.7（2026-11-22 完成）。

### 9.7 圆角回退 + 第三圈 F009 组件化（2026-11-22 完成，未提交）

**圆角回退（用户要求）**：§9.6 把自由窗口圆角从 16px 改成 `rounded-freewin`(30px) 后，
部分页面细节被大圆角裁切。恢复修改前形式：

- `FreeWindow.tsx:323` `rounded-freewin` → `rounded-2xl`（16px）。
- `WindowHeader.tsx:107` `rounded-t-freewin` → `rounded-t-2xl`（16px）。
- `SplitView.tsx` 原本就是 30px（`rounded-[30px]`），保留等价的 token 写法
  `rounded-freewin`，**视觉未变**，不属于本次回退范围。

> 涟漪：窗口圆角不再是赛季 `rounded-freewin`(30px)，而是标准容器档 16px；
> 这是用户基于实际裁切问题的决定，记录在案，后续勿误判为「漏改」。

**F009 组件化**（`SystemInfoContent.tsx` 全量重写，数据逻辑原样保留）：

| 原手写 | 替换为 |
| --- | --- |
| `h2` 标签 | Astryx `Text as="h2" type="label" weight="semibold" color="secondary"`（语义 h2，14px/600 走角色 token） |
| 布局 `div` | `VStack gap` / `HStack gap`（间距走 4px step）、`Card padding/variant`（表面 + 边框走主题） |
| 行文本 `span` | `Text type="code" size="sm"`（mono 标签）/ `Text type="label" weight="medium"`（值）/ `hasTabularNumbers` |
| 区块分隔 `border-t` | Astryx `Divider` |
| 脉冲骨架 `div` | Astryx `Skeleton radius={2} index={i}`（token 圆角 + 交错节奏） |

保留的原生元素仅两类：装饰点（`<span aria-hidden>`）、外链图片（`<img>`，Astryx 模板允许的图片例外）。
`motion.section` 三段 stagger 与 reduced-motion 降级保留。

**验证（2026-11-22）**：

- `tsc --noEmit` **0 错误** / `vitest run` **67/67** / `vite build` ✓ 4.24s。
- Playwright 明暗双面 **20/20 断言 ALL PASS**：窗口与标题栏圆角 **16px**（回退生效）、
  H2 14px/600/正常字距（Astryx Text label）、0 glow / 0 gradient / 0 巨型数字、
  无 12px 圆角与 6/10/14px 间距、磨砂带走 token、登录窗口圆角同为 16px、
  内容仍渲染、0 非预期控制台错误。
- 截图：`screenshots/sysinfo-{light,dark}-f009-after.png`（后端恢复在线，Go/.NET 显示真实值）。
- 分类：**verified**，无 revert。

**审查闭环**：F001–F011 全部处置完成；原始评分 Design C+ / AI Slop C 作为基线保留，
最终评分不再重算（组件化后视觉已按方案收敛）。2001 临时服务已清理。

### 9.8 「Asagity 信息」卡片重构 + 页脚（2026-11-22 完成，未提交）

**问题**：原卡片混用 `border-b` 与 `Divider` 两套分隔线，字体在 mono / body 之间跳；
窗口滚到底时页尾贴边，没有呼吸空间。

**重构**（Astryx 官方 `MetadataList` 模式）：

- `SpecRow` 改为 `MetadataListItem`，整卡包在 `MetadataList columns={1} label={{ position: "start", width: 112 }}`，
  渲染为语义 `dl`/`dt`/`dd`，分隔由组件统一接管，移除手写 `Divider` 与所有 `border-b`（错乱分割线清零）。
- 字体分组：`运行模式` / `React 版本` / `服务端版本` 标签与中文值走 `--font-sans`
  （`HarmonyOS Sans SC` 优先，中文自动命中 SC；拉丁回退 `HarmonyOS Sans`），
  符合 §4 字体按语种智能映射；`React 19.3.1` 与 Go / .NET 运行时值走 `font-quicksand`
  （`--font-quicksand` 已存在，Quicksand variable 字库随主题加载）。
- Go / .NET 运行时行保留状态点（无辉光）与 `hasTabularNumbers`，数据值 Quicksand。

**页脚**（用户确认后的两个决定）：

- 文案：`2026 Asagity Developer by CyaniAgent and contributors. Licensed by MIT`。
  原需求写 `AGPL-3.0`，但仓库根目录 `LICENSE` 实为 **MIT**，为避免文案与授权文件不符，
  用户确认改为 MIT；`CyaniAgent` 链接原给 `hitjhub.com/CyaniAgent`（不可达），
  用户确认改为 `https://github.com/CyaniAgent`（与仓内 `GITHUB_ORG_URL` 一致）。
- MIT 链接：`https://github.com/CyaniAgent/Asagity/blob/Dev/LICENSE`（远端默认分支为 `Dev`）。
- 底部留白：`mt-8 pb-8`（32px + 32px），实测滚到底后文字下方仍有 **32px** 空隙。

**验证（2026-11-22）**：`tsc --noEmit` 0 / `vitest` **67/67** / `vite build` ✓ 4.51s；
Playwright 明暗 **20/20 断言 ALL PASS**：`dl`×1 / `dt`×3 / `dd`×3、
标签与中文值 HarmonyOS SC、React 与运行时值 Quicksand、页脚文案与两枚链接正确、
底部空隙 32px、0 非预期控制台错误。
截图：`screenshots/sysinfo-{light,dark}-card-footer.png`。分类 **verified**，无 revert。

### 9.9 页脚字号统一 + 「服务端版本」分组修复（2026-11-22 完成，未提交）

**页脚字号**：原实现用 `Text type="supporting"`(12px) 渲染普通文字，链接却是裸 `<a>`
（继承 16px），同一行出现两种字号。修复：两枚链接各自包进
`Text as="span" type="supporting"`，只用 `text-fgaccent hover:underline` 上色。
实测明暗双面全部 6 个节点（4 段文字 + 2 枚链接）均为 **12px / 20px 行高**。

**「服务端版本」问题讨论**（用户要求深入讨论后决策）：

- 根因是语义结构而非样式：`MetadataListItem` 渲染一对 `<dt>label</dt><dd>value</dd>`，
  原实现把一个「服务端版本」`dt` 配上装着 Go + .NET 两行的 `dd`。视觉上标签贴着 Go 行，
  .NET 行看起来无标签；辅助技术会把两行读成一个复合值。
- Astryx 官方 `MetadataList` 文档明确要求：**"Give each MetadataListItem a short label
  that names its value. Assistive technology reads each label with its value as a term and
  its definition."** 且 `label` 只接受 `string`，无 rowSpan / 分组 API；`Table` 也无行分组能力。
  因此纯 CSS 跨行居中只能掩盖视觉，无法修正语义。
- 候选方案：A 拆两条（丢分组）／**B 分组标题 + 两条**／C 合并一行值（长值易截断）／
  D CSS 跨行（语义不变）／E 换 Table（混用两套组件语言）。用户选择 **B**。

**实施**：卡片内改为两个 `MetadataList`：

1. 第一个：`运行模式`、`React 版本`（`valueClass="font-quicksand"`）。
2. 第二个：`title={<Text as="h3">服务端版本</Text>}`（官方推荐的「列表需要在页面大纲占位时传标题元素」用法），
   内含 `Go` / `.NET` 两条独立 `MetadataListItem`，每条 label 命名自己的值，
   状态点通过 `icon` prop 渲染（`bg-brand` / `animate-pulse` / `bg-fg/20`），
   值走 `font-quicksand` + `hasTabularNumbers`。

**验证（2026-11-22）**：`tsc --noEmit` **0** / `vitest` **67/67** / `vite build` ✓ 1.85s；
Playwright 明暗 **22/22 断言 ALL PASS**：`dl`×2 / `dt`×4（运行模式、React 版本、Go、.NET）
/ `dd`×4、h3「服务端版本」存在、标签与中文值 HarmonyOS SC、React 与运行时值 Quicksand、
页脚文案与链接、底部 32px、0 非预期错误。另跑页脚专项 **6/6**（全 12px / 20px 行高）。
截图覆盖为 `screenshots/sysinfo-{light,dark}-card-footer.png`（明版截图恰逢成员数据 loading，
显示三行骨架，属正常异步态）。2001 已清理。

### 9.10 项目组织者重构（2026-11-22 完成，未提交）

**需求**：只列头像 + GitHub 显示名；背景透明；由「单卡片聚合」改为「逐条显示」；
固定 4 位（组织 `CyaniAgent`，用户 `AyaxYuna` / `SakuraCake` / `shenwenbo2009`）；
默认 2×2，随窗口缩放动态重排。

**实施**：

- 删除 `fetchGithubList("org-members")`、`LoadState<GithubPerson[]>`、`PeopleSkeleton`、
  组织大卡 + 重叠头像堆 + 成员计数；改为固定常量 `ORGANIZERS`（4 条），
  不再依赖 shell 网关，也消除了后端离线时的骨架/裸标题态。
- 布局用 Astryx `Grid columns={{ minWidth: 280, max: 4, repeat: "fit" }} gap={3}`：
  官方明确要求「响应式列用 minWidth + max，禁止固定列数」。760px 窗口内容区约 700px →
  默认 **2 列 × 2 行**；容器收窄到 420px → 1 列；放宽到 1200px → 最多 4 列。
  重排由 CSS Grid 跟随容器宽度，不依赖 viewport 媒体查询，自由窗口拖拽即生效。
- 每条是一个 `<a href="https://github.com/{login}">`，内含 Astryx `Avatar`
  （`name` + `src` + `size=40` + `tooltip=false`，加载失败时按官方行为回退首字母）
  与一枚 `Text type="label" weight="medium"` 显示名；容器与条目均无背景/描边（透明）。

**验证（2026-11-22）**：`tsc --noEmit` **0** / `vitest` **67/67** / `vite build` ✓ 1.64s；
Playwright 明暗 **18/18 断言 ALL PASS**：恰好 4 条且顺序正确、每条 1 头像 + 1 名称、
链接全部指向 GitHub、背景与描边透明、默认 2 列 / 窄 1 列 / 宽 4 列、
无成员计数与骨架、0 非预期控制台错误。
截图：`screenshots/sysinfo-{light,dark}-organizers-bottom.png`（滚到底，头像已加载）。
分类 **verified**，无 revert。2001 已清理。

### 9.11 「Asagity」英雄区重建为手机系统设置式（2026-11-22 完成，未提交）

**背景**：原始英雄区（冰河壁纸 + 巨型 `204` + 底部版本文案）是用户参考 HarmonyOS /
ColorOS 等「关于本机」页的灵感。之前清理违规实现（150px 装饰数字、渐变 scrim、
periwinkle 光斑、彩色发光）时把这层语汇一并抹掉了。用户要求按方案 B 重建。

**调研结论**：websearch 402、Bing/DDG 结果无效；以 Astryx 官方 `Heading`（`display-1`
视觉角色 + 语义 h1）、`Text`（display 角色）、`Card`、`MetadataList` 文档与既有
Design Conventions 为依据。手机「关于本机」的共性：强身份标题 + 大号 build/型号 +
状态标记 + 中性分组卡片 + 单一 accent；与铁律冲突的只有装饰渐变和发光。

**实施**：

- 英雄区顶部：`Heading level={1} type="display-1"` 渲染 `Asagity`（实测 42px/600），
  右侧一枚中性状态胶囊（`bg-fg/5` + `border-line`，复用 `runMode` 文案）。
- 冰河照片保留；底部唯一信息带 `bg-sheet/80 backdrop-blur-glasslight`
  （无渐变/无发光）：左侧版本文案 + 赛季代号，右侧 **`BUILD` 小标签 + `204` 展示数值**。
- `204` 改回真数据：`getBuildVersion().commitsTotal` + `Text type="display-1"`
  + `font-quicksand` + `tabular-nums`（实测 42px），有标签、可解释，**不是装饰数字**；
  用户确认字体走 Quicksand，与 React/Go/.NET 数据一致。
- 去掉旧 `type="code"` 的赛季代号，改 `type="supporting"`（HarmonyOS Sans，按语种映射）。
- `lib/version.ts` 中「巨型 Build 数字（数据即装饰）」注释同步改为「带 BUILD 标签的展示数值」。

**验证（2026-11-22）**：`tsc --noEmit` **0** / `vitest` **67/67** / `vite build` ✓ 1.88s；
Playwright 明暗 **16/16 断言 ALL PASS**：h1 42px、状态胶囊中性底、`BUILD` 标签、
`204` Quicksand 42px、磨砂带走 token 且 0 渐变、0 发光、内容完整、0 非预期错误。
截图：`screenshots/sysinfo-{light,dark}-hero-mobile.png`。分类 **verified**，无 revert。

### 9.12 英雄区按反馈简化：去顶部标题 / 去 BUILD / 文档融入照片（2026-11-22 完成，未提交）

用户对 §9.11 的反馈：① 顶部大标题 + 状态胶囊不要；② 图片内版本显示块不能被容器包住，
要「顺其背景、融入冰河照片」；③ 右侧 BUILD 数字纯属多余。

**实施**：

- 删 `Heading level={1}` 的 `Asagity`、状态胶囊、`BUILD` 标签与 `204` 展示数值；
  同时移除 `Heading` / `getBuildVersion` 的 import 与 `build` memo。
  `lib/version.ts` 的注释回退为中性描述（不再指向已删除的 BUILD 展示）。
- 版本文案直接绝对定位在照片左下角：只有定位用的 `HStack`，**无 `Card`、
  无 `bg-sheet/80` 磨砂带、无 `backdrop-blur`、无背景/描边**；
  文字用 `text-white`（Astryx `Text` 自身设色，白色必须写在 Text 节点上，
  写在祖先无效）配中性 `drop-shadow-md` 保证基本可读性，不引入渐变或发光。
- 赛季代号保留在版本文案下方，同样白色系。

**验证（2026-11-22）**：`tsc --noEmit` **0** / `vitest` **67/67** / `vite build` ✓ 2.38s；
Playwright 明暗 **16/16 断言 ALL PASS**：无 h1、无 `BUILD`、无大号 204、
照片仍在、版本文字白色、三层祖先均无背景/描边/模糊、0 渐变 0 发光、
内容完整、0 非预期错误。截图：`screenshots/sysinfo-{light,dark}-hero-on-photo.png`。

**诚实标注**：明版照片左下为亮冰面，白字对比度比磨砂带方案吃紧；
这是「无容器、融入背景」的直接代价。§9.13 已补暗色文字投影解决，仍未加暗色遮罩/渐变（守铁律一）。
分类 **verified**，无 revert。

### 9.13 照片文字投影 / 去图标 / 图片禁右键（2026-11-22 完成，未提交）

用户三项反馈：① 左下文字区加适当阴影；② 版本号左侧图标多余，删除；
③ 禁止浏览器在图片区域右键，防止图片被盗。

**实施**：

- `globals.css` 新增 `.on-photo-ink`：取赛季「冰下」`#001421` 的暗色投影
  `0 1px 2px rgba(0,20,33,.95) + 0 2px 6px rgba(0,20,33,.55)`，
  并附带 `-webkit-touch-callout: none` / `user-select: none`。
  这是**可读性投影，不是发光/氛围光斑**，不违反 §1.4。
- 英雄区 `HStack` 换用 `.on-photo-ink`，移除 `drop-shadow-md`；
  删掉版本号左侧的 `bg-brand` 竖条 `<span>`。
- 照片容器加 `onContextMenu={(e) => e.preventDefault()}` 与 `select-none`；
  `<img>` 加 `draggable={false}` 与 `pointer-events-none`（右键事件落到容器被拦下，
  同时禁止拖拽保存）。

**验证（2026-11-22）**：`tsc --noEmit` **0** / `vitest` **67/67** / `vite build` ✓ 1.49s；
Playwright 明暗 **16/16 断言 ALL PASS**：文字投影 `rgba(0,20,33,.95) 0px 1px 2px` 存在、
白字保留、`bg-brand` 图标 0 个、`contextmenu` 事件 `defaultPrevented=true`、
图片 `draggable=false` 且 `pointer-events=none`、0 渐变 0 发光、0 非预期错误。
截图：`screenshots/sysinfo-{light,dark}-hero-shadow.png`。分类 **verified**，无 revert。

**诚实标注**：禁右键 + 禁拖拽只提高随手保存门槛，无法阻止 DevTools /
网络请求取图，不是真正的版权保护；若需强保护需服务端签名或水印方案（超出本次范围）。

### 9.14 自由窗口活跃机制 + 真全屏修复（2026-11-22 完成，未提交）

**Bug 1 · 点非活跃窗口无反应**

- 根因：`FreeWindow.tsx` 的 `onFocus?.()` 只在拖拽柄路径末尾调用，且开头有
  `if (isMaximized) return`；点窗口正文或已最大化窗口不会触发。
  另外所有窗口写死 `zIndex: 9990`，`focusedId` 只被 `RunManager` 消费，窗口本体无活跃态。
- 修复：`onFocus` 移到 `handlePointerDown` 最前（任意区域按下都激活），
  并补根节点 `onFocus`（键盘可达）；`WindowManager` 订阅 `focusedId`，按
  `lastFocusedAt` 排序传 `isActive` / `stackOrder`；`FreeWindow` 计算
  `zIndex = 9990 + (isActive ? 100 : stackOrder)`，活跃窗置顶、其余稳定层叠，
  仍低于 modal/toast 的 100002。store 结构未改（`focus` 已维护 `focusedId` + `lastFocusedAt`）。

**Bug 2 · 最大化仍留圆角**

- 根因：最大化几何留 16px 边距（`innerWidth-32` / `x=16`），内层 div 恒定
  `rounded-2xl border shadow-2xl`，`WindowHeader` 恒定 `rounded-t-2xl`。
- 修复：最大化几何改 `0,0,innerWidth,innerHeight`；内层切 `rounded-none border-0 shadow-none bg-sheet`
  （**不透明**，消除欢迎页透出）；普通态保留 `rounded-2xl border border-line shadow-2xl bg-sheet/90 backdrop-blur-glassheavy`；
  标题栏顶角随 `isMaximized` 切 `rounded-none`。

**验证（2026-11-22）**：新增 `src/stores/__tests__/freeWindow.test.ts` 4 条用例
（开窗即活跃 / focus 切换并 bump / 关闭活跃回退 / 单例聚焦），
`tsc --noEmit` **0** / `vitest` **71/71** / `vite build` ✓ 1.95s。
Playwright E2E **8/8 断言 ALL PASS**：两窗初始层级正确、点非活跃窗正文后 z 翻转、
最大化几何 `0,0,1440,900`、圆角/边框/阴影全无且底色不透明、还原回 16px、0 错误。
截图：`screenshots/window-maximized.png`。分类 **verified**，无 revert。

---

*Asagity Design Standard v2 · Neutral Baseline — 2026-11-09（§7 图标选型：Fluent → Lucide；
2026-11-14 §1.2 修订：主 CTA 优先 accent 实底；2026-11-14 §6 追加：更多菜单锚定触发钮 + 收起动画；
2026-11-20 §9 追加：系统信息窗口设计审查方案；§9.5 第一圈；§9.6 第二圈共享外壳；
2026-11-22 §9.7 圆角回退 + F009 组件化；§9.8 信息卡重构 + 页脚；§9.9 页脚字号 + 服务端版本分组；
§9.10 项目组织者 4 条透明响应式 Grid；§9.11 手机系统设置式英雄区；
§9.12 英雄区去顶部/BUILD，版本文案直接融入照片；§9.13 文字投影 + 去图标 + 图片禁右键；
§9.14 自由窗口活跃机制 + 真全屏）*
