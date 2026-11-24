# 前端任务管理器（菜单 + Dock）

- 状态：**第一版已实施（2026-11-22）**，页面条带（P1）未接入，flash 暂由 `main` 边框承接；配套总评审见 `docs/review/home-shell-redesign.md`。
- 位置：`DashboardLayout` 底部居中，取代旧左侧 `PageManager`。

## 1. 结构

```
[首页占位] [时间线] [消息] │ [▦ 程序列表] [运行项…]
       左快捷方式       分隔符        右侧管理区
```

- 容器：`bg-sheet/80 backdrop-blur-glassheavy rounded-2xl`，4px 网格间距，元素水平居中。
- 图标按钮 40×40（Astryx `IconButton` 或等价 token 化实现），`aria-label` + tooltip。
- 运行项带 active 指示点（`bg-brand`），非 active 中性点。

## 2. 统一应用目录（P0）

```ts
type AppEntry = {
  id: string;
  icon: string;
  labelKey: string;              // i18n key
  launch: { kind: "route" | "window" | "split"; id: string };
  group: "shortcut" | "app" | "more";
};
```

合并来源：

- `pagemanager/pageManagerConfig.ts` 的 `DEFAULT_PAGE_MENU`（话题、云盘、聊天→消息、空间→原俱乐部、公告、设置、更多）。
- `welcome/welcomeConfig.ts` 的 `menuGroups`（公告、关于实例、系统信息、联邦实例、数据面板、联系人、开发者组 termity/verseNET…）。
- 固定三快捷方式：首页（占位）、时间线、消息（原聊天）。

**A-Z 排序**：`new Intl.Collator(i18n.locale).compare(t(a.labelKey), t(b.labelKey))`，
中文按拼音序、英文按词序；排序在渲染时计算，不写死配置顺序。

## 3. 程序列表弹层

- 按钮 `▦`（`grid_view` / `apps`），点击用 Astryx `Popover` 在**上方**弹出
  （`placement="above"`，light-dismiss，Esc 关闭，焦点归还按钮）。
- 内容：A-Z 排序后的应用项，图标 + 显示名；点击按 `launch.kind` 分发：
  - `route` → `push(id)` 并在页面条带追加/聚焦对应 tile。
  - `window` → `openFromContext(id)`，由自由窗口浮层承接。
  - `split` → `splitViewStore.open(id)`。

## 4. 运行项三态语义（核心状态机）

运行项来源：页面条带 tiles、splitView、freeWindow，三者统一为
`TaskItem { id, kind, icon, title, active }`。

| 目标状态 | 点击行为 | 实现 |
| --- | --- | --- |
| 页面（route/split tile）处于 active | **高亮该页面边缘 3 秒** | `pageStrip.flashTab(tabId)` → tile `ring-2 ring-brand`，3s 后清除；减动效下用静态边框 |
| 页面 tab 已最小化（只保留顶栏） | **恢复为活跃 tab** | `pageStrip.activateTab(tabId)`，`minimized=false`（Misskey 非活跃列折叠语义） |
| 自由窗口 active 且未最小化 | **最小化窗口** | `freeWindow.setMinimized(id, true)` |
| 自由窗口非 active 或已最小化 | **回到 active** | `freeWindow.focus(id)`（现有实现已把 `isMinimized` 复位） |
| split 非 active | 聚焦该 split | `splitViewStore.focusRight()` |

> 注意：`focus()` 同时更新 `focusedId` 与 `lastFocusedAt`，所以任务栏点击自然形成
> LRU 层叠；不要再写一套排序逻辑。

## 5. 可访问性与动效

- Dock 用 `role="toolbar"`，项目可 Tab 遍历；程序列表弹层遵守 APG menu-button：
  `aria-haspopup/expanded/controls`、↑↓ 导航、Esc、焦点归还。
- 3s 高亮是**瞬态反馈**，不是持续状态；`prefers-reduced-motion` 下不做动画只留边框。
- 所有图标走 `Icon.tsx` 的 Lucide 线性集，禁止 emoji / 彩色徽章。

## 6. 验证计划

- 单测：应用目录去重与本地化 A-Z；三态判定纯函数（active page → flash、active window → minimize、inactive/minimized window → focus）。
- Playwright：打开两窗口，点 active 窗口任务断言最小化；点最小化项断言恢复并置顶；点 active 页面任务断言 tile 出现 ring 且 3s 后消失；程序列表 A-Z 顺序与 Esc 关闭。
- 全量 `tsc --noEmit` / `vitest run` / `vite build`。
