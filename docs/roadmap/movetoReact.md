# Asagity Frontend Migration: Vue/Nuxt → React ✅ COMPLETE

> **迁移状态**: ✅ 已完成 (2026-07-04)
> **旧项目**: `web-old/` 已删除
> **当前前端**: `web/` (Next.js 16 + React 19)

---

## 迁移背景

原 `web-old/` 目录基于 **Nuxt 4 + Vue 3 + Pinia** 实现了完整的原型。迁移至 React 旨在:

- React 生态在复杂交互（拖拽窗口、自由浮动面板、实时数据流）方面拥有更成熟的社区方案
- TypeScript 类型推断在 React 生态中更为原生
- 全球化社区支持，中大型项目验证充分
- 便于未来接入更多第三方 SDK（地图、视频会议、LiveKit 等）

---

## 最终技术栈

| 领域 | 旧方案 (Vue) | 新方案 (React) | 状态 |
|------|-------------|---------------|------|
| **框架** | Nuxt 4 (Vue 3) | **Next.js 16 (App Router, Turbopack)** | ✅ |
| **UI 库** | Nuxt UI v4 | **Tailwind CSS v4 + 自定义组件** | ✅ |
| **状态管理** | Pinia | **Zustand** (persist middleware) | ✅ |
| **数据获取** | useApi ($fetch) | **原生 fetch + Zustand** | ✅ |
| **路由** | 文件系统 (Nuxt) | **App Router (文件系统)** | ✅ |
| **i18n** | @nuxtjs/i18n | **客户端 i18n** (4 语言: zh-CN/zh-TW/en-US/ja-JP) | ✅ |
| **图标** | Iconify (Material Symbols) | **@fluentui/react-icons** v2 | ✅ |
| **动画** | @vueuse/motion | **Framer Motion** | ✅ |
| **拖拽窗口** | VueUse (useDraggable) | **react-rnd** | ✅ |
| **分割视图** | 手动鼠标事件 | **react-resizable-panels** | ✅ |
| **图表** | ECharts (vue-echarts) | **ECharts (echarts-for-react) + Recharts** | ✅ |
| **音乐** | music-metadata + lrc-kit | **music-metadata + lrc-kit** (纯 JS) | ✅ |
| **MFM** | mfm-js | **mfm-js** (直接使用) | ✅ |
| **CSS** | Tailwind CSS v4 | **Tailwind CSS v4** | ✅ |
| **包管理** | pnpm | **pnpm** | ✅ |
| **测试** | 无 | **Vitest + React Testing Library + Playwright** | ✅ |
| **PWA** | 无 | **Service Worker + manifest.json** | ✅ |

---

## 迁移完成清单

### Phase 0: 基础设施 ✅
- [x] Next.js 16 项目初始化 (Turbopack)
- [x] 核心依赖安装 (Zustand, Framer Motion, react-rnd, react-resizable-panels, etc.)
- [x] 字体/音效/图片资源迁移
- [x] `globals.css` Tailwind 主题迁移
- [x] `next.config.ts` 配置 (API 代理 `:2048`, CSP 安全头, WebSocket)
- [x] TypeScript 严格模式配置
- [x] `src/lib/api.ts` (fetch wrapper + Bearer token)
- [x] `src/types/` (API 类型 + 数据模型)

### Phase 1: 状态层 + 认证 ✅
- [x] 11 个 Zustand Store 完整迁移
- [x] `middleware.ts` 路由守卫
- [x] 持久化: user, theme, locale, music, notifications

### Phase 2: 布局系统 ✅
- [x] `MainLayout.tsx` — Inverted-L 主布局
- [x] `Sidebar.tsx` — 左侧导航
- [x] `SplitView.tsx` — react-resizable-panels 分割视图
- [x] `MobileNav.tsx` — 移动端底部导航
- [x] `ClientLayout.tsx` — I18nProvider + WindowManager

### Phase 3: 核心页面 ✅
- [x] `/` — 时间线 (TimelineFeed + PostItem + PostDetail)
- [x] `/login` — 登录/注册 (AuthForm)
- [x] `/post/[id]` — 帖子详情
- [x] `/user/[id]` — 用户主页
- [x] `/settings/*` — 7 个设置子页面
- [x] `/drive/*` — Skyline Drive (3 页面)
- [x] `/bookmarks` — 书签/收藏
- [x] `/topic/*` — 话题系统
- [x] `/chat/*` — 聊天系统 (4 页面)
- [x] `/panel/*` — 管理面板 (15+ 页面, Recharts 图表)
- [x] `/about/*` — 关于页面 (4 页面)
- [x] `/announcement` — 公告页面
- [x] `/developer` — 开发者页面 + Termity 终端

### Phase 4: 音乐播放器 ✅
- [x] `useMusicStore` — Zustand (lrc-kit + music-metadata)
- [x] `MusicPlayer.tsx` — 封面毛玻璃 + 播放控制
- [x] `LyricsPreview.tsx` — 单行歌词预览
- [x] `LyricsWindow.tsx` — FreeWindow 歌词
- [x] `PlaylistWindow.tsx` — FreeWindow 播放列表
- [x] `AudioQualityTag.tsx` — Hi-Res/Lossless/HQ/Standard

### Phase 5: 窗口系统 + 上下文菜单 ✅
- [x] `FreeWindow.tsx` — react-rnd 拖拽窗口
- [x] `WindowHeader.tsx` — 窗口标题栏 (switchMode)
- [x] `WindowManager.tsx` — 全局窗口管理器 (lazy-loaded)
- [x] `ContextMenu.tsx` — 5 种菜单 (global/post/user/link_internal/link_external)
- [x] `WidgetsPanel.tsx` — 右侧 Widgets 面板

### Phase 6: i18n ✅
- [x] 客户端 i18n (无 URL-based locale routing)
- [x] 4 语言文件: zh-CN, zh-TW, en-US, ja-JP (518 keys each)
- [x] `I18nProvider` — 静态 import map + useMemo 优化
- [x] `LanguageSwitcher` — 语言切换组件
- [x] 50+ 组件国际化完成

### Phase 7: 管理面板 ✅
- [x] ECharts + Recharts 图表集成
- [x] 15+ 管理页面 (Overview, Users, Federation, Emojis, etc.)
- [x] Termity 终端模拟

### Phase 8: 优化 + 测试 ✅
- [x] 代码分割 (`next/dynamic` 懒加载 WindowManager)
- [x] 图片优化 (`next/image` 替换 17 处 `<img>`)
- [x] Bundle 分析 (`@next/bundle-analyzer`)
- [x] 单元测试 (Vitest + React Testing Library, 17 tests)
- [x] E2E 测试 (Playwright 配置)
- [x] PWA 支持 (Service Worker + manifest.json)
- [x] CSP 安全头 (移除 unsafe-eval, 添加 X-Frame-Options 等)
- [x] 错误边界 (ErrorBoundary 组件)

---

## 目录结构 (实际)

```
web/
├── next.config.ts              # API 代理, CSP, WebSocket, Bundle Analyzer
├── middleware.ts                # Auth 路由守卫
├── vitest.config.ts            # 单元测试配置
├── playwright.config.ts        # E2E 测试配置
├── public/
│   ├── fonts/                  # HarmonyOS Sans SC, JetBrains Mono
│   ├── sounds/                 # 音效文件
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service Worker
├── src/
│   ├── app/                    # App Router 页面
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # / → Welcome 或 TimelineFeed
│   │   ├── globals.css         # Tailwind v4 主题
│   │   ├── post/[id]/page.tsx
│   │   ├── user/[id]/page.tsx
│   │   ├── settings/           # 7 个设置页面
│   │   ├── drive/              # Skyline Drive
│   │   ├── chat/               # 聊天系统
│   │   ├── panel/              # 管理面板 (15+ 页面)
│   │   ├── about/              # 关于页面
│   │   ├── bookmarks/
│   │   ├── topic/
│   │   ├── announcement/
│   │   └── developer/
│   ├── components/
│   │   ├── layout/             # MainLayout, Sidebar, SplitView, etc.
│   │   ├── windows/            # FreeWindow, WindowManager
│   │   ├── music/              # MusicPlayer, Lyrics, Playlist
│   │   ├── post/               # PostItem, PostDetail, TimelineFeed
│   │   ├── ui/                 # Icon, ContextMenu, SplashScreen, etc.
│   │   ├── providers/          # I18nProvider, ServiceWorkerRegistration
│   │   ├── termity/            # Termity 终端
│   │   └── shared/             # NetworkStatus
│   ├── stores/                 # 11 个 Zustand Store
│   ├── types/                  # TypeScript 类型
│   ├── lib/                    # api.ts, utils.ts
│   └── messages/               # i18n 语言包 (4 语言)
```

---

## 验证命令

```bash
pnpm dev          # 开发服务器 (Turbopack)
pnpm build        # 生产构建
pnpm lint         # ESLint
pnpm typecheck    # TypeScript 类型检查
pnpm test         # 单元测试 (17 tests)
pnpm test:e2e     # E2E 测试 (Playwright)
pnpm analyze      # Bundle 分析
```

---

## 迁移耗时

- **实际工期**: ~4 周 (单人)
- **原预估**: 8-9 周 (单人)
- **加速原因**: 大量组件可直接迁移 (Store 逻辑、类型、样式), Turbopack 加速开发

---

*Migration completed by CyaniAgent - 2026-07-04*
