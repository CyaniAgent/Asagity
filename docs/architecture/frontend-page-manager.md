# 前端页面管理器（Misskey Deck × niri 混合标签页条带）

- 状态：**第一版已实施（2026-11-23）**：niri 式横向条带 + Misskey 式 Tab 顶栏与更多菜单已落地；配套总评审见 `docs/review/home-shell-redesign.md`。
- 决策不变：自研，不引入 react-mosaic / react-dnd；自由窗口 `FreeWindow` 继续浮层。
- 新增参考：Misskey Deck 的**列头 + 列菜单**模式，替代原先只有拖拽手柄的抽象列模型。

## 1. 调研来源

| 来源 | 一手资料 | 采纳点 |
| --- | --- | --- |
| Misskey Deck | [`column.vue`](https://github.com/misskey-dev/misskey/blob/develop/packages/frontend/src/ui/deck/column.vue) | 每个 tab/列有独立顶栏：左侧色条 + 标题，右侧设置按钮；菜单含刷新、列设置、flexible 开关、左右移动、堆叠、弹出为列、危险删除；点击标题滚动内容到顶；头可拖拽重排；非活跃堆叠列折叠到标题栏高度 |
| Misskey 语言包 | [`locales/en-US.yml`](https://github.com/misskey-dev/misskey/blob/develop/locales/en-US.yml) `_deck.*` | `configureColumn`、`flexible`、`usedAsMinWidthWhenFlexible`、`swapLeft/Right/Up/Down`、`stackLeft`、`popRight`、`addColumn` |
| Misskey store | [`deck-store.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/frontend/src/ui/deck/deck-store.ts) | 列与布局持久化（`columns` + `layout`），deviceAccount 作用域 |
| niri | [README](https://github.com/niri-wm/niri)、[Layout](https://niri-wm.github.io/niri/Configuration%3A-Layout.html) | 横向条带、追加新列不重排旧列、1/3·1/2·2/3 预设、active focus-ring |

## 2. 核心概念

```
PageStrip
└── Column[]                      // 横向可滚动，追加新列不改旧列宽度
    ├── display: "stack" | "tabbed"
    └── tabs: PageTab[]           // 每个 tab 自带顶栏与内容区
PageTab = {
  id, appId, icon, title,
  width, autoWidth: true,        // 自适应宽度默认开
  minimized: false,
  history: { stack: string[], index: number },
  view: { kind: "route"|"split"|"window", refId }
}
```

**一个 tab 的视觉结构**（Misskey 列头语汇）：

```
┌──────────────────────────────────────────────┐
│ [图标] 应用名称           [☰] [↻] [─] [×红]   │ ← 顶栏 h-10
├──────────────────────────────────────────────┤
│                                              │
│               标签页内容区域                   │ ← flex-1 min-h-0 overflow-auto
│                                              │
└──────────────────────────────────────────────┘
```

## 3. 顶栏规范

- 高 40px（4px 网格，Misskey 原值 38px），`bg-sheet/80 border-b border-line`，
  左侧 3px accent 色条（对应 Misskey 的 `.color`），标题 `Text type="label" weight="semibold"`。
- 右侧按钮**从左到右固定顺序**：`更多(☰)` → `刷新(↻)` → `最小化(─)` → `关闭(×)`。
- 按钮 28×28（沿用 `WindowHeader` 的 BTN 规格），关闭用 `text-bad hover:bg-bad/10`
  （**token 化危险色**，不用 raw `red-500`）。
- 顶栏可拖拽重排（HTML5 DnD + 键盘 `Alt+←/→` 替代），点击标题区滚动内容到顶部。
- 最小化 = tab 只保留顶栏（Misskey 非活跃列 `flex-basis: headerHeight`），内容区不渲染；
  任务栏点击该 tab 时恢复活跃（与 `frontend-task-manager.md` 三态语义一致）。

## 4. 「更多」菜单（按用户指定顺序）

| 项 | 行为 | 参考 |
| --- | --- | --- |
| **宽度设置** | 子菜单/弹层：宽度预设（窄 1/3 / 中 1/2 / 宽 2/3 / 固定 px）+ **自适应宽度开关，默认开启**。开启时宽度值作为最小宽度，按容器剩余空间伸缩（Misskey `flexible` + `usedAsMinWidthWhenFlexible` 语义） | Misskey `configureColumn` + `flexible` |
| **前进** | tab 内历史栈前进一步；无下一项时禁用 | Misskey `goBack` 语汇；浏览器式 |
| **后退** | tab 内历史栈后退一步；无上一项时禁用 | 同上 |
| **弹出到窗口** | 调用 `freeWindow.openFromContext(viewType/data)`，成功后关闭该 tab；路由类 tab 需映射到浏览器窗口或专用 viewType（实施时定） | Misskey `popRight` / `openInWindow` |
| **一键结束任务** | 禁用项，标注「开发中」 | 项目 `comingSoon` 既有模式 |

保留但移出「更多」的操作：重排（顶栏拖拽）、关闭（顶栏 ×）、最小化（顶栏 ─）、刷新（顶栏 ↻）。
这与 Misskey 把刷新放在菜单不同，是用户明确指定的顶栏顺序。

## 5. Store 设计（`stores/pageStrip.ts`，zustand + persist）

```ts
type PageStripState = {
  columns: PageColumn[];
  activeTabId: string | null;
  flashTabId: string | null;          // 任务栏触发的 3s 边缘高亮
  appendTab: (columnId: string, tab: PageTab) => void;
  closeTab: (tabId: string) => void;
  toggleMinimize: (tabId: string) => void;
  setWidth: (tabId: string, width: number | "1/3" | "1/2" | "2/3") => void;
  setAutoWidth: (tabId: string, v: boolean) => void;   // 默认 true
  back: (tabId: string) => void;
  forward: (tabId: string) => void;
  popOut: (tabId: string) => void;
  moveTab: (fromId: string, toColumnId: string, index?: number) => void;
  flashTab: (tabId: string) => void;  // setTimeout 3000 清空
};
```

- 持久化 key `asagity-page-strip`，`version: 1`；旧 `asagity-pagemanager` 不迁移，避免双源。
- 历史栈按 tab 独立，避免多个 tab 共享浏览器历史互相干扰。
- `flashTab` 用模块级 timer，重复触发先清旧 timer；减动效下用静态 `ring-2 ring-brand`。

## 6. 布局与交互

- 容器 `flex flex-row gap-4 overflow-x-auto h-full min-h-0`；列宽走预设比例或固定 px，
  `autoWidth=true` 时取 `min-width` + `flex: 1`。
- **追加不重排**：新 tab/column 追加到条带右侧，旧列宽度不变（niri 语义）。
- active tab 用 `ring-1 ring-brand`（focus-ring），非 active 不加彩色描边。
- 列内 `stack` = 纵向列表；`tabbed` = 顶部 tab 条 + 当前内容。
- 空列占位常驻（niri empty workspace），提供 `+` 从应用目录新增 tab。
- 键盘：顶栏拖拽替代 `Alt+←/→`，菜单可 `Enter/Space` 打开、`Esc` 关闭、焦点归还。

## 7. 与现有模块的边界

- `view.kind === "route"`：usePathname + push，历史栈记录路由字符串。
- `view.kind === "split"`：映射 `splitViewStore.currentRightViewType`。
- `view.kind === "window"`：快捷入口；真正窗口仍在 `freeWindowStore` 浮层，任务栏统一调度。
- 「弹出到窗口」是 tab → FreeWindow 的单向迁移；反向（窗口回到条带）暂不支持，记录为后续项。
  窗口标题栏「作为标签页打开」已接线：FreeWindow → tab，并复用 `renderContent` 渲染真实内容（2026-11-23）。
- P2 任务管理器已上线；active 页面高亮使用 `flashTab(tabId)`。
- 登录态非根路由由 `ClientLayout` 注入 routeTab 进入新外壳；公开路由仍由 RouteView/MainLayout 承接。

## 8. 验证计划

- 单测：追加不改旧宽；`autoWidth` 默认 true 且关闭后固定宽；最小化只保留顶栏；
  history back/forward 边界；`flashTab` 3s 清空；按显示名去重。
- Playwright：顶栏四按钮顺序与图标；更多菜单五项与禁用态；宽度开关切换后计算宽度变化；
  最小化后内容区消失、任务栏点击恢复；弹出到窗口后 tab 消失且 FreeWindow 出现；
  3s 高亮出现并清除；减动效降级；0 非预期控制台错误。
- 全量 `tsc --noEmit` / `vitest run` / `vite build`。
