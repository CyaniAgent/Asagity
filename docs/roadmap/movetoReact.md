# Asagity Frontend Migration: Vue/Nuxt → React

## 迁移背景

当前 `web-old/` 目录基于 **Nuxt 4 + Vue 3 + Pinia** 实现了完整的原型。迁移至 React 旨在:

- React 生态在复杂交互（拖拽窗口、自由浮动面板、实时数据流）方面拥有更成熟的社区方案
- TypeScript 类型推断在 React 生态中更为原生
- 全球化社区支持，中大型项目验证充分
- 便于未来接入更多第三方 SDK（地图、视频会议、LiveKit 等）

---

## 1. 技术栈选型

| 领域 | 旧方案 (Vue) | 新方案 (React) | 选型理由 |
|------|-------------|---------------|---------|
| **框架** | Nuxt 4 (Vue 3) | **Next.js 15 (App Router)** | SSR/SSG/ISR 全覆盖，React Server Components 原生支持，Vercel 生态 |
| **UI 库** | Nuxt UI v4 | **Radix UI + Tailwind CSS v4 + shadcn/ui** | 无样式原语 + 原子化 CSS + 可复制组件模式，完全可控 |
| **状态管理** | Pinia | **Zustand** | 极简 API，无 Provider 嵌套，TypeScript 友好，支持 middleware 持久化 |
| **数据获取** | useApi ($fetch) | **TanStack Query (React Query)** | 缓存、乐观更新、后台刷新、SSR 集成，远超手动实现 |
| **路由** | 文件系统 (Nuxt) | **App Router (文件系统)** | 概念一致，迁移自然 |
| **i18n** | @nuxtjs/i18n | **next-intl** | App Router 原生集成，轻量，支持 ICU 消息格式 |
| **图标** | Iconify (Material Symbols) | **lucide-react + @iconify/react** | 保留 Material Symbols 能力，同时获得 React 原生图标组件 |
| **动画** | @vueuse/motion | **Framer Motion** | React 动效事实标准，支持 layout animations、手势 |
| **拖拽** | VueUse (useDraggable) | **@dnd-kit** | 可访问的拖拽库，支持 sortable、droppable，性能优秀 |
| **图表** | ECharts (vue-echarts) | **ECharts (echarts-for-react)** | 保持 ECharts 能力，React 封装层 |
| **音乐** | music-metadata + lrc-kit | **music-metadata-browser + lrc-kit** | 纯 JS 库，直接复用 |
| **MFM** | mfm-js | **mfm-js** (直接使用) | 无框架依赖，纯 JS 解析器 |
| **CSS** | Tailwind CSS v4 | **Tailwind CSS v4** | 直接迁移，零改动 |
| **包管理** | pnpm | **pnpm** | 保持不变 |

---

## 2. 目录结构规划

```
web/
├── next.config.ts              # Next.js 配置
├── package.json
├── tsconfig.json
├── tailwind.config.ts          # Tailwind v4 配置 (如需自定义)
├── public/                     # 静态资源
│   ├── sounds/                 # 音效文件
│   └── fonts/                  # HarmonyOS Sans, JetBrains Mono
├── src/
│   ├── app/                    # App Router 页面
│   │   ├── layout.tsx          # 根布局 (字体、全局 Provider)
│   │   ├── page.tsx            # / → 时间线
│   │   ├── globals.css         # 全局样式 + Tailwind
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── about/page.tsx
│   │   ├── drive/page.tsx
│   │   ├── drive/drop/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── personalization/page.tsx
│   │   ├── topic/
│   │   │   ├── page.tsx
│   │   │   └── create/page.tsx
│   │   ├── chat/
│   │   │   ├── page.tsx
│   │   │   └── contacts/page.tsx
│   │   ├── panel/
│   │   │   ├── page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── post/[id]/page.tsx
│   │   ├── bookmarks/page.tsx
│   │   ├── announcement/page.tsx
│   │   ├── orgs/page.tsx
│   │   ├── more/page.tsx
│   │   └── developer/page.tsx
│   ├── components/
│   │   ├── layout/             # 布局组件
│   │   │   ├── Sidebar.tsx           # 左侧导航栏
│   │   │   ├── SplitView.tsx         # 分割视图容器
│   │   │   ├── WidgetsPanel.tsx      # 右侧 Widgets 面板
│   │   │   ├── MobileNav.tsx         # 移动端底部导航
│   │   │   └── MainLayout.tsx        # Inverted-L 主布局
│   │   ├── windows/            # 窗口系统
│   │   │   ├── FreeWindow.tsx        # 可拖拽浮动窗口
│   │   │   ├── WindowHeader.tsx      # 窗口标题栏
│   │   │   └── WindowManager.tsx     # 全局窗口管理器
│   │   ├── social/             # 社交核心
│   │   │   ├── PostItem.tsx
│   │   │   ├── PostDetail.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserPopover.tsx
│   │   │   ├── TimelineFeed.tsx
│   │   │   └── TopicCard.tsx
│   │   ├── music/              # 音乐播放器
│   │   │   ├── MusicPlayer.tsx
│   │   │   ├── LyricsWindow.tsx
│   │   │   ├── LyricsPreview.tsx
│   │   │   └── PlaylistWindow.tsx
│   │   ├── drive/              # 云盘
│   │   │   ├── DriveExplorer.tsx
│   │   │   ├── FileItem.tsx
│   │   │   └── StorageUsage.tsx
│   │   ├── ui/                 # 通用 UI (shadcn/ui 风格)
│   │   │   ├── Button.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── DropdownMenu.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Popover.tsx
│   │   │   └── SplashScreen.tsx
│   │   ├── chat/
│   │   │   └── ChatDetail.tsx
│   │   ├── admin/
│   │   │   └── DatabaseDetails.tsx
│   │   └── shared/
│   │       ├── MfmRenderer.tsx
│   │       ├── NetworkStatus.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorContent.tsx
│   ├── stores/                 # Zustand 状态管理
│   │   ├── user.ts
│   │   ├── system.ts
│   │   ├── theme.ts
│   │   ├── music.ts
│   │   ├── timeline.ts
│   │   ├── splitView.ts
│   │   ├── freeWindow.ts
│   │   ├── contextMenu.ts
│   │   ├── notifications.ts
│   │   ├── instance.ts
│   │   └── soundManager.ts
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useApi.ts           # API 客户端 (TanStack Query 集成)
│   │   ├── useAuth.ts          # 认证逻辑
│   │   ├── useHeartbeat.ts     # 后端心跳检测
│   │   ├── useMediaQuery.ts    # 响应式断点
│   │   ├── useDragResize.ts    # 拖拽 + 缩放
│   │   └── useClickOutside.ts  # 点击外部关闭
│   ├── lib/                    # 工具函数
│   │   ├── api.ts              # fetch 封装 + Bearer token 注入
│   │   ├── utils.ts            # cn(), formatDate(), 等
│   │   └── constants.ts        # 常量定义
│   ├── types/                  # TypeScript 类型
│   │   ├── api.ts              # API 响应类型
│   │   ├── models.ts           # 数据模型
│   │   └── windows.ts          # 窗口系统类型
│   └── i18n/                   # 国际化
│       └── messages/
│           ├── zh.json
│           ├── en.json
│           └── ja.json
├── middleware.ts                # Next.js 中间件 (路由守卫)
└── .env.local                  # 环境变量
```

---

## 3. 迁移策略: 分阶段并行

### Phase 0: 基础设施 (Week 1)

**目标**: 搭建 React 项目骨架，确保开发环境可用。

**任务**:
- [ ] 在 `web/` 初始化 Next.js 15 项目 (`create-next-app`)
- [ ] 安装核心依赖: Zustand, TanStack Query, Tailwind CSS v4, next-intl, Framer Motion, @dnd-kit, lucide-react
- [ ] 复制 `web-old/app/assets/fonts/` → `web/public/fonts/`
- [ ] 迁移 `globals.css` (Tailwind 主题 + HarmonyOS Sans 字体定义)
- [ ] 配置 `next.config.ts` (API 代理到 `:2048`, 图标集合, CSP)
- [ ] 配置 TypeScript 严格模式
- [ ] 创建 `src/lib/api.ts` (fetch wrapper, Bearer token 注入)
- [ ] 创建 `src/types/` (API 类型, 数据模型)
- [ ] 验证: `pnpm dev` 启动无报错

**产出**: 可运行的空白 Next.js 项目，连接后端 API 可通。

---

### Phase 1: 状态层 + 认证 (Week 2)

**目标**: 所有 Zustand Store + 认证流程可用。

**任务**:

#### Store 迁移映射 (Pinia → Zustand)

| Pinia Store | Zustand Store | 关键变更 |
|------------|--------------|---------|
| `useUserStore` | `useUserStore` | `useCookie` → Zustand persist middleware (localStorage) |
| `useSystemStore` | `useSystemStore` | `$fetch` → native fetch; `import.meta.client` → `useEffect` |
| `useThemeStore` | `useThemeStore` | Nuxt colorMode → `data-theme` attribute + localStorage |
| `useMusicStore` | `useMusicStore` | `import.meta.client` → `useEffect` 中初始化 Audio |
| `useTimelineStore` | `useTimelineStore` | localStorage cache 直接复用 |
| `useSplitViewStore` | `useSplitViewStore` | 直接迁移，无框架依赖 |
| `useFreeWindowStore` | `useFreeWindowStore` | 直接迁移，无框架依赖 |
| `useContextMenuStore` | `useContextMenuStore` | 直接迁移，无框架依赖 |
| `useNotificationsStore` | `useNotificationsStore` | 直接迁移，无框架依赖 |
| `useInstanceStore` | `useInstanceStore` | 直接迁移 |
| `useSoundManagerStore` | `useSoundManagerStore` | 直接迁移 |

**Zustand 持久化模式**:
```typescript
// 示例: user.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  isLoggedIn: boolean
  accessToken: string | null
  user: UserProfile | null
  setAuth: (data: AuthData) => void
  logout: () => void
  // ...
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      accessToken: null,
      user: null,
      setAuth: (data) => set({ isLoggedIn: true, accessToken: data.access_token, user: data.user }),
      logout: () => set({ isLoggedIn: false, accessToken: null, user: null }),
    }),
    { name: 'asagity-user' }  // localStorage key
  )
)
```

#### 认证路由守卫

Vue: `middleware/auth.global.ts`
React: `middleware.ts` (Next.js Edge Middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('asagity_access_token')
  const publicPaths = ['/', '/login', '/register', '/about']

  if (!token && !publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

**产出**: 全部 Store 可用，登录/登出/刷新流程正常，路由守卫生效。

---

### Phase 2: 布局系统 (Week 3)

**目标**: Inverted-L 布局、分割视图、移动端适配。

**任务**:

#### 组件迁移映射

| Vue 组件 | React 组件 | 复杂度 | 说明 |
|---------|-----------|-------|------|
| `default.vue` (721行) | `MainLayout.tsx` | 高 | Inverted-L + Widgets Panel |
| `AppFreeWindow.vue` | `FreeWindow.tsx` | 高 | `useDraggable` → `@dnd-kit/core` 或 `react-rnd` |
| `AppWindowHeader.vue` | `WindowHeader.tsx` | 低 | 直接迁移 |
| `AppWidgetsSidebar.vue` | `WidgetsPanel.tsx` | 中 | 拖拽分隔条 → `react-resizable-panels` |
| `AppContextMenu.vue` | `ContextMenu.tsx` | 中 | Teleport → React Portal |
| `AppSplashScreen.vue` | `SplashScreen.tsx` | 低 | 直接迁移 |
| `AppNetworkStatus.vue` | `NetworkStatus.tsx` | 低 | 直接迁移 |

#### 关键技术映射

| Vue 特性 | React 等价方案 |
|---------|---------------|
| `<Teleport to="body">` | `ReactDOM.createPortal()` |
| `useDraggable` (VueUse) | `react-rnd` 或 `@dnd-kit` + `useDraggable` |
| `useElementBounding` | `useElementBounding` from `@uidotdev/usehooks` 或手写 `useRef` + `getBoundingClientRect` |
| `onClickOutside` | `useClickOutside` 自定义 hook |
| `useWindowSize` | `useMediaQuery` + `useEffect` |
| `ref()` | `useState()` 或 `useRef()` |
| `computed()` | `useMemo()` 或 `useCallback()` |
| `watch()` | `useEffect()` 依赖数组 |
| `onMounted` / `onUnmounted` | `useEffect()` return cleanup |
| `nextTick()` | `flushSync()` 或 `requestAnimationFrame()` |

**FreeWindow 实现方案**:
```typescript
// React 方案: react-rnd (react-resizable-and-draggable)
import { Rnd } from 'react-rnd'

export function FreeWindow({ children, title, onClose }) {
  return (
    <Rnd
      default={{ x: 100, y: 100, width: 450, height: 600 }}
      dragHandleClassName="window-header"
      bounds="parent"
    >
      <div className="glass-panel">
        <WindowHeader title={title} onClose={onClose} />
        {children}
      </div>
    </Rnd>
  )
}
```

**产出**: Inverted-L 布局可交互，浮动窗口可拖拽，移动端自适应。

---

### Phase 3: 核心页面 (Week 4-5)

**目标**: 所有已实现页面迁移完成。

**任务**: 按优先级分批迁移页面组件。

#### 页面迁移清单

| 优先级 | 页面 | 路由 | Vue 组件依赖 | 复杂度 |
|-------|------|------|-------------|-------|
| **P0** | 时间线 | `/` | `AppHomeTimeline`, `AppPostItem`, `TimelineFeed` | 高 |
| **P0** | 登录 | `/login` | `AppAuthWindow` | 中 |
| **P0** | 注册 | `/register` | `AppAuthWindow` | 中 |
| **P1** | 帖子详情 | `/post/[id]` | `AppPostDetail` | 中 |
| **P1** | 用户主页 | - | `AppUserProfile` | 中 |
| **P1** | 设置 | `/settings` | 设置面板组件 | 低 |
| **P1** | Skyline 云盘 | `/drive` | Drive 相关组件 | 中 |
| **P2** | 话题 | `/topic` | `AppTopicCard` | 低 |
| **P2** | 聊天 | `/chat` | `AppChatDetail` | 中 |
| **P2** | 管理面板 | `/panel` | ECharts 图表 | 中 |
| **P2** | 关于 | `/about` | 静态内容 | 低 |
| **P3** | 更多 | `/more` | 菜单网格 | 低 |
| **P3** | 公告 | `/announcement` | 列表 | 低 |
| **P3** | 书签 | `/bookmarks` | 列表 | 低 |
| **P3** | 控制台 | `/panel` | `AppTermity` (终端模拟) | 中 |
| **P3** | Drop 上传 | `/drive/drop` | 断点续传组件 | 中 |

#### 组件迁移映射 (核心)

| Vue 组件 | React 组件 | 行数 | 备注 |
|---------|-----------|------|------|
| `AppHomeTimeline.vue` | `TimelineFeed.tsx` | ~300 | 无限滚动 → `IntersectionObserver` 或 `react-infinite-scroll-component` |
| `AppPostItem.vue` | `PostItem.tsx` | ~200 | MFM 渲染 + 右键菜单 |
| `AppPostDetail.vue` | `PostDetail.tsx` | ~150 | 分割视图内容 |
| `AppUserProfile.vue` | `UserProfile.tsx` | ~200 | 个人资料卡 |
| `AppUserPopover.vue` | `UserPopover.tsx` | ~100 | Hover 弹出层 |
| `AppMusicPlayer.vue` | `MusicPlayer.tsx` | ~300 | 最复杂的交互组件 |
| `AppAuthWindow.vue` | `AuthForm.tsx` | ~200 | 登录/注册表单 |
| `MfmRenderer.vue` | `MfmRenderer.tsx` | ~150 | mfm-js 直接封装 |
| `AppBrowser.vue` | `InAppBrowser.tsx` | ~80 | iframe 封装 |
| `AppTopicCard.vue` | `TopicCard.tsx` | ~60 | 话题卡片 |
| `AppNotifications.vue` | `NotificationList.tsx` | ~100 | 通知列表 |
| `AppChatDetail.vue` | `ChatDetail.tsx` | ~150 | 聊天视图 |
| `AppDatabaseDetails.vue` | `DatabaseDetails.tsx` | ~100 | 管理面板 |
| `AppTermity.vue` | `Terminal.tsx` | ~200 | 开发者终端 |

**产出**: 所有核心页面可用，路由跳转正常。

---

### Phase 4: 音乐播放器 (Week 5-6)

**目标**: 完整音乐播放系统迁移。

**任务**:
- [ ] 迁移 `useMusicStore` → Zustand (Audio 元素在 `useEffect` 中初始化)
- [ ] 迁移 `AppMusicPlayer.vue` → `MusicPlayer.tsx` (封面毛玻璃 + 播放控制)
- [ ] 迁移 `MusicLyrics.vue` → `LyricsPreview.tsx` (3 行歌词)
- [ ] 迁移 `MusicLyricsWindow.vue` → `LyricsWindow.tsx` (FreeWindow 内歌词)
- [ ] 迁移 `MusicPlaylistWindow.vue` → `PlaylistWindow.tsx`
- [ ] 音质标签 (Lossless/Hi-Res/HQ/Standard) → React 组件
- [ ] LRC 歌词同步 → `lrc-kit` 直接使用

**技术要点**:
- `import.meta.client` 检查 → `useEffect` + `useState` + SSR 安全
- `HTMLAudioElement` 在 `useRef` 中持有，`useEffect` 中挂载事件监听
- 音量/进度/歌词索引 → Zustand store 驱动 UI

**产出**: 音乐播放器功能完整，歌词同步正常。

---

### Phase 5: 窗口系统 + 上下文菜单 (Week 6)

**目标**: FreeWindow + SplitView + ContextMenu 系统。

**任务**:
- [ ] `AppFreeWindow.vue` → `FreeWindow.tsx` (react-rnd)
- [ ] `AppWindowHeader.vue` → `WindowHeader.tsx`
- [ ] `AppTaskWindow.vue` → `WindowManager.tsx` (按 viewType 路由渲染)
- [ ] `AppContextMenu.vue` → `ContextMenu.tsx` (React Portal + 点击检测)
- [ ] SplitView 分隔条 → `react-resizable-panels`
- [ ] Widgets 面板 → `WidgetsPanel.tsx`

**产出**: 浮动窗口可拖拽/缩放/最大化/最小化，右键菜单全局可用。

---

### Phase 6: i18n + 国际化 (Week 7)

**目标**: 三语言支持。

**任务**:
- [ ] 配置 `next-intl` (App Router)
- [ ] 迁移语言包: `zh.json`, `en.json`, `ja.json`
- [ ] 替换所有硬编码字符串 → `t('key')` 调用
- [ ] 语言切换器组件
- [ ] RTL 支持预留 (虽非必要)

```typescript
// next-intl 配置
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}))
```

**产出**: 三语言切换正常，所有 UI 文本已国际化。

---

### Phase 7: 管理面板 + ECharts (Week 7-8)

**目标**: 管理控制台迁移。

**任务**:
- [ ] ECharts → `echarts-for-react` 封装
- [ ] 管理面板页面 (`/panel`)
- [ ] 数据库统计面板
- [ ] 实例设置页面
- [ ] 开发者终端 (`AppTermity`)

**产出**: 管理面板功能完整。

---

### Phase 8: 优化 + 测试 (Week 8-9)

**目标**: 性能优化、测试覆盖、部署准备。

**任务**:
- [ ] 代码分割 (`next/dynamic` 懒加载)
- [ ] 图片优化 (`next/image`)
- [ ] Bundle 分析 (`@next/bundle-analyzer`)
- [ ] Lighthouse 审计 (目标: Performance > 90)
- [ ] 单元测试 (Vitest + React Testing Library)
- [ ] E2E 测试 (Playwright)
- [ ] PWA 支持 (next-pwa, 如需)
- [ ] CSP 安全头配置
- [ ] API 错误边界 (Error Boundary)
- [ ] 离线缓存策略 (Service Worker)

**产出**: 生产就绪，性能达标，测试覆盖。

---

## 4. 关键迁移模式

### 4.1 API 层: $fetch → fetch + TanStack Query

```typescript
// Vue (useApi composable)
const api = useApi()
const data = await api.get<UserProfile>('/api/auth/me')

// React (TanStack Query)
import { useQuery } from '@tanstack/react-query'

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${useUserStore.getState().accessToken}` }
    }).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
}
```

### 4.2 响应式: ref/computed → useState/useMemo

```typescript
// Vue
const count = ref(0)
const doubled = computed(() => count.value * 2)

// React
const [count, setCount] = useState(0)
const doubled = useMemo(() => count * 2, [count])
```

### 4.3 生命周期: onMounted → useEffect

```typescript
// Vue
onMounted(() => {
  startHeartbeat()
})
onUnmounted(() => {
  stopHeartbeat()
})

// React
useEffect(() => {
  startHeartbeat()
  return () => stopHeartbeat()
}, [])
```

### 4.4 事件监听: addEventListener → useEffect

```typescript
// Vue
onMounted(() => {
  window.addEventListener('resize', handler)
})
onUnmounted(() => {
  window.removeEventListener('resize', handler)
})

// React
useEffect(() => {
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, [])
```

### 4.5 模板引用: ref="el" → useRef

```vue
<!-- Vue -->
<template>
  <div ref="el">...</div>
</template>
<script setup>
const el = ref<HTMLElement>()
</script>
```

```tsx
// React
const el = useRef<HTMLDivElement>(null)
return <div ref={el}>...</div>
```

---

## 5. 不可直接迁移的组件 (需重写)

| 组件 | 原因 | 方案 |
|------|------|------|
| `AppFreeWindow.vue` | 重度依赖 `useDraggable` (VueUse) | 使用 `react-rnd` 重写 |
| `AppSplashScreen.vue` | 依赖 Nuxt 生命周期 | React + useEffect 重写 |
| `default.vue` | Nuxt 布局系统 | React 组合模式 (children + Outlet) |
| `AppContextMenu.vue` | Teleport + onClickOutside | React Portal + 自定义 hook |
| `auth.global.ts` | Nuxt 中间件 | Next.js middleware.ts |
| `useApi.ts` | 依赖 `$fetch` (Nuxt) + `useUserStore` (Pinia) | fetch + Zustand + TanStack Query |
| `useIconCache.ts` | 依赖 Nuxt 运行时 | React hook + fetch |

---

## 6. 可直接迁移的代码

| 类别 | 迁移难度 | 说明 |
|------|---------|------|
| Zustand Store 逻辑 | 低 | Pinia `defineStore` → Zustand `create`, API 几乎一致 |
| TypeScript 类型 | 无 | 直接复制 |
| CSS/Tailwind 样式 | 无 | 直接复制 (类名不变) |
| 字体文件 | 无 | 直接复制到 public/ |
| mfm-js 使用 | 低 | 纯 JS 库，直接调用 |
| music-metadata | 低 | 纯 JS 库，直接调用 |
| lrc-kit | 低 | 纯 JS 库，直接调用 |
| ECharts 配置 | 低 | 直接复制 option 对象 |
| 路由结构 | 无 | 文件系统路由概念一致 |
| 国际化语言包 | 无 | JSON 直接复制 |

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| FreeWindow 拖拽性能 | 高 | 使用 `react-rnd`（性能优化过的库），避免手写拖拽 |
| SSR/CSR 水合不匹配 | 高 | Audio/Window 等浏览器 API 严格包裹在 `useEffect` 中 |
| Zustand 持久化数据迁移 | 中 | 提供 localStorage 键名映射，兼容旧数据 |
| ECharts SSR 兼容 | 中 | `dynamic` import + `ssr: false` |
| 字体加载闪烁 | 低 | 复用 `font-display: swap` + `next/font` 预加载 |

---

## 8. 时间线总览

```
Week 1   ████████  Phase 0: 基础设施
Week 2   ████████  Phase 1: 状态层 + 认证
Week 3   ████████  Phase 2: 布局系统
Week 4   ████████  Phase 3: 核心页面 (Part 1)
Week 5   ████████  Phase 3: 核心页面 (Part 2) + Phase 4: 音乐
Week 6   ████████  Phase 5: 窗口系统
Week 7   ████████  Phase 6: i18n + Phase 7: 管理面板
Week 8   ████████  Phase 8: 优化 + 测试
Week 9   ████████  Phase 8: 收尾 + 上线准备
```

**预计总工期**: 8-9 周 (单人) / 4-5 周 (2人并行)

---

## 9. 完成标准

- [ ] 所有 `web-old/` 已实现页面在 React 中功能等价
- [ ] 所有 11 个 Zustand Store 逻辑完整迁移
- [ ] Inverted-L 布局 + SplitView + FreeWindow 可用
- [ ] 音乐播放器 (含歌词同步) 功能完整
- [ ] 三语言 (zh/en/ja) 支持
- [ ] 后端心跳检测 + 离线降级可用
- [ ] 开发者模式 + 终端模拟可用
- [ ] Lighthouse Performance ≥ 90
- [ ] 核心页面单元测试覆盖
- [ ] E2E 测试覆盖登录 → 时间线 → 帖子详情流程

---

## 10. 验证命令

迁移完成后需确保:
```bash
pnpm dev          # 开发服务器启动
pnpm build        # 生产构建成功
pnpm lint         # ESLint 无报错
pnpm typecheck    # TypeScript 类型检查通过
pnpm test         # 单元测试通过
```
