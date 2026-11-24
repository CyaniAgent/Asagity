# 主页外壳重构方案评审（2026-11-22）

- 项目：Asagity；分支：`Dev`；状态：**方案定稿，待实施**。
- 范围：保留顶栏，重构其下整体；中间为 niri 式平铺页面管理器，下方为菜单 + 任务栏合体的「任务管理器」。
- 本文是总评审与决策记录；详细设计见 `docs/architecture/frontend-page-manager.md` 与
  `docs/architecture/frontend-task-manager.md`。

## 1. 背景

现有 `DashboardLayout.tsx:24-45` 是 TopBar + 左侧 `PageManager`(w-64) + 内容 + 右侧
Widgets(w-72)。用户要求去掉侧栏式外壳，改成 ChromeOS + niri 的操作系统式体验：

- 中间是**页面管理器**，类 react-mosaic 的可平铺/可重排工作区。
- 下方是**任务管理器**，居中显示，融合应用菜单与 Dock/任务栏。

## 2. 调研来源与结论

> websearch 持续 HTTP 402，本轮资料通过 webfetch 抓一手站点获得。

| 来源 | 一手资料 | 关键结论 | 采纳情况 |
| --- | --- | --- | --- |
| react-mosaic v7 | [README](https://github.com/nomcopter/react-mosaic)、[llms.txt](https://nomcopter.github.io/react-mosaic/llms.txt)、[tree-structure](https://nomcopter.github.io/react-mosaic/docs/concepts/tree-structure.md)、[updates](https://nomcopter.github.io/react-mosaic/docs/concepts/updates.md) | n-ary 树（split/tabs/leaf）、受控 `value+onChange`、数字路径、`updateTree` + `createRemoveUpdate`/`createHideUpdate`/`createExpandUpdate`/`createDragToUpdates`/`createBalancedTreeFromLeaves`、react-dnd、JSON 持久化、父容器需明确高度、CSS 变量主题化 | **不引入依赖**，仅借鉴树/路径/持久化思路 |
| niri | [README](https://github.com/niri-wm/niri)、[Layout](https://niri-wm.github.io/niri/Configuration%3A-Layout.html) | 横向无限条带上的列；**新窗口不重排已有窗口**；列可 tabbed；预设列宽 1/3、1/2、2/3；focus-ring/border 区分 active/inactive；gaps/struts；`center-focused-column` | **核心布局灵感** |
| ChromeOS Shelf | 官方帮助页 404，按公开交互范式 | 居中图标条 + 应用启动器 + 运行指示；点击运行项聚焦 | Dock 形态参考 |
| Astryx | 本地 CLI `astryx component Grid/Avatar/MetadataList`、Design Conventions | `Grid columns={{minWidth,max}}`、`Popover`/`DropdownMenu`、`HStack`/`Card`；token 化、状态配对 | 直接复用组件 |
| Misskey Deck | [`column.vue`](https://github.com/misskey-dev/misskey/blob/develop/packages/frontend/src/ui/deck/column.vue)、[`deck-store.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/frontend/src/ui/deck/deck-store.ts)、[`locales/en-US.yml`](https://github.com/misskey-dev/misskey/blob/develop/locales/en-US.yml) `_deck.*` | 列头 = 色条 + 标题 + 设置点；菜单含刷新、列设置（width + flexible 自适应）、移动/堆叠/弹出/删除；非活跃列折叠到标题栏高度；列与布局持久化 | **新增**：标签页顶栏 + 更多菜单形态按此重做 |

**为什么不直接用 react-mosaic**：用户选择自研 niri 横向条带。理由是 react-mosaic
默认「新增面板挤压已有面板」，与 niri 的「追加列、旧列不变」冲突；且引入 react-dnd
与一套需重写的默认主题。自研可用现有 `flex` + `SplitView`/`Grid` 能力，控制在项目内。

## 3. 现状盘点（可复用资产）

| 文件 | 现状 |
| --- | --- |
| `DashboardLayout.tsx:24-45` | 四区外壳，需改为 TopBar + 全宽工作区 + 底部 Dock |
| `pagemanager/PageManager.tsx` | 上 QuickMenu + 下 RunManager，需从侧栏迁到 Dock |
| `pagemanager/RunManager.tsx:18-146` | 已统一 route / split / window 三类运行项，含 `focus` / `setMinimized` / `close` 动作，任务管理器直接复用这套语义 |
| `pagemanager/QuickMenu.tsx` + `MoreMenuPopover` | 菜单直达与「更多」弹层，合并进应用目录 |
| `pagemanager/pageManagerConfig.ts:21-33` | 话题 / 云盘 / 聊天 / 空间 / 公告 / 设置 / 更多，正好是应用目录雏形 |
| `welcome/welcomeConfig.ts` `menuGroups` | 欢迎页「更多」菜单的公告、关于实例、系统信息、联邦、数据面板、联系人、开发者组等，需并入应用目录 |
| `stores/freeWindow.ts` | `focusedId` / `focus()` / `setMinimized()` 已支撑窗口活跃与恢复，无需改结构 |

## 4. 决策记录

| 议题 | 决策 | 理由 |
| --- | --- | --- |
| 平铺引擎 | **B 自研 niri 横向条带** | 新页不重排旧页；零新依赖；可控主题 |
| 自由窗口 | **A 保持浮层** | 保留已修复的活跃机制与真全屏；任务栏统一调度，风险最低 |
| A-Z 排序 | **A 本地化显示名** | `Intl.Collator(locale)`，中文拼音序、英文词序 |
| 标签页形态 | **Misskey Deck 列头模式（2026-11-23 新增）** | 每个 tab 有独立顶栏：左 app 图标+名称，右 `更多/刷新/最小化/关闭`；更多菜单含宽度设置（自适应默认开）、前进/后退、弹出到窗口、一键结束任务（开发中） |

## 5. 目标结构

```
┌──────────────────────── TopBar（保留） ────────────────────────┐
│ 页面条带（横向可滚动，列 = 1/3 | 1/2 | 2/3 预设宽度，自适应默认开）│
│ ┌────────────┐ ┌──────────────┐ ┌────────────┐                 │
│ │▌◈时间线 ☰↻─×│ │▌◈云盘   ☰↻─×│ │▌◈话题   ☰↻─×│ ← 顶栏四按钮     │
│ │            │ │ 关于 / 设置   │ │            │   旧列尺寸不变    │
│ └────────────┘ └──────────────┘ └────────────┘                 │
│                                                              │
│ 自由窗口浮层（FreeWindow，z 9990+，仍由任务栏统一调度）          │
├──────────────────────────────────────────────────────────────┤
│  [首页] [时间线] [消息]  │  [▦]  [运行项…]   ← Dock 居中        │
└──────────────────────────────────────────────────────────────┘
```

## 6. 分期实施

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| P0 应用目录 | 合并 `pageManagerConfig` + `welcomeConfig.menuGroups`，统一 `AppEntry`（id/icon/labelKey/launch/group），locale A-Z | 单元测试排序与去重 |
| P1 页面条带 | ✅ 已实施第一版：store（列/tab/宽度预设/autoWidth 默认开/active/history/3s flash）、Misskey 式 tab 顶栏与更多菜单、追加新列不重排、任务栏开页接入 | tsc 0 / vitest 81/81 / build ✓；Playwright 明暗 19+7 断言通过 |
| P2 任务管理器 | ✅ 已实施：Dock 三快捷方式 + A-Z 程序弹层（显示名去重）+ 运行项三态；3s 高亮暂由 `main` 边框承接 | Playwright 17/17 断言通过 |
| P3 外壳替换 | 部分完成：登录态**所有路由**统一进新外壳（ClientLayout 把非根路由作为 routeTab 注入条带）；SettingsLayout 去掉 MainLayout 并 token 化；旧侧栏/小组件用开关禁用。公开路由（未登录 /about 等）仍走 RouteView + MainLayout，属剩余范围 | 跨路由 Playwright 通过 |
| P4 打磨 | 减动效、键盘操作、tooltip、持久化迁移、空列占位 | `tsc` / `vitest` / `vite build` |

## 7. 风险与回滚

- **状态双源**：`pageManager` / `splitView` / `freeWindow` 三个 store 要收敛到「应用目录 + 页面条带 + 运行项」三个入口，避免同一内容两处状态。P0 先做目录再动 UI。
- **持久化兼容**：`asagity-pagemanager` 已有 localStorage 数据，新增 strip store 用独立 key `asagity-page-strip` 并带 schema version，不复用旧 key。
- **拖拽与键盘**：自研 DnD 必须提供键盘替代（左右移动/关闭按钮），否则 a11y 不过。
- **回滚**：每期独立提交；P3 之前旧侧栏保留在 feature flag 后，可一键切回。

## 8. 文档索引

- `docs/architecture/frontend-page-manager.md`：页面条带数据模型与交互。
- `docs/architecture/frontend-task-manager.md`：Dock 与应用目录、三态语义。
- `docs/design-standard.md` §10：外壳视觉规范。
