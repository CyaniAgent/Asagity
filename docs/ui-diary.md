# Asagity UI Diary

本文档记录了 Asagity 项目的核心 UI 设计规范与布局逻辑，旨在确保跨设备开发时视觉与交互体验的高度一致性。

## 1. 核心视觉理念 (Aesthetic Concept)

- **主题风格**：Vocaloid + Cyberpunk + Glassmorphism。
- **初音绿 (Miku Green)**：核心品牌色 `#39C5BB` (Primary)。
- **玻璃态 (Glassmorphism)**：大量使用 `backdrop-blur` 与半透明边框，模拟轻量、通透的 3D 空间感。

## 2. 色彩系统 (Color Palette)

| 用途 | 颜色 (HEX/Tailwind) | 说明 |
| :--- | :--- | :--- |
| **Primary** | `#39C5BB` / `primary-500` | 初音绿，用于按钮、高亮、链接。 |
| **Accent** | `#22D3EE` / `cyan-400` | 辅助青色，用于阴影、发光特效。 |
| **Background (Dark)** | `#111827` / `gray-900` | 主界面深色底色。 |
| **Surface (Dark)** | `rgba(31, 41, 55, 0.4)` / `gray-800/40` | 玻璃容器底色。 |
| **Border** | `rgba(255, 255, 255, 0.1)` | 极细的白色半透明边框。 |

## 3. 布局架构 (Layout Architecture)

### 3.1 核心比例与间距
- **圆角 (Border Radius)**：
    - 主容器/卡片：`30px` (极度圆润，表现软妹感与高级感)。
    - 侧边栏按钮：`16px` (rounded-2xl)。
- **间距 (Spacing)**：
    - 侧边栏分组间距：`gap-3`。
    - 导航项垂直间距：`gap-0.5` (紧凑型设计，参考 Misskey)。

### 3.2 拆分视图系统 (Split View System)
- **多任务流**：左侧为主时间线，右侧为详情页（用户、帖子、音乐、通知）。
- **可拖拽分栏**：
    - 最小宽度：`20%`。
    - 最大宽度：`80%`。
- **沉浸模式 (Maximize)**：
    - 逻辑：右侧占 `100%`，左侧 `translateX(-100%)`。
    - 记忆化：通过 `isMaximized` 标志位控制，不改变 Store 中原本的比例数据。

## 4. 特色组件设计

### 4.1 沉浸式音乐播放器 (AppMusicPlayer)
- **背景渲染**：基于当前曲目封面生成的毛玻璃背景 (`backdrop-blur-3xl`)。
- **绝对布局**：导航栏固定在顶部 (`absolute top-0`)，封面图 (`pt-24`) 全尺寸展示。
- **垂直堆叠**：在窄屏/分屏下采用封面 -> 控制区 -> 歌词的纵向流。

### 4.2 侧边栏任务管理器 (Split View Manager)
- **位置**：左侧边栏底部，发布按钮上方。
- **交互**：实时监控右侧 Split View 的内容，并提供一键关闭 (`X`) 与图标联动。

## 5. 交互与动画 (Motion)

- **曲线 (Easing)**：`cubic-bezier(0.4, 0, 0.2, 1)`。
- **时长 (Duration)**：
    - 界面切换：`500ms`。
    - 悬停缩放：`105%` (hover:scale-105)。
- **微交互**：
    - 激活项：`shadow-[0_0_15px_rgba(57,197,187,0.5)]` 外发光。
    - 拖拽条：悬停时显示初音绿高亮。

## 6. 开发备忘 (Cheat Sheet)

- **字体**：
    - UI 文字：`HarmonyOS Sans SC` (华为中文字库)。
    - 代码/等宽：`JetBrains Mono`。
- **API 通信**：
    - 状态管理：Zustand (`stores/`)。
    - 音频元数据：`music-metadata` v11 (Blob 原生解析)。
- **图标**：`@fluentui/react-icons` v2 (Fluent UI System Icons)。

---
## 7. 动态自由窗口系统 (Dynamic Free Window System)

### 7.1 架构原理
- **容器脱离 (Portal)**：自由窗口通过 `ReactDOM.createPortal()` 渲染至 `document.body`，完全隔离 `SplitView` 容器的尺寸变化及缩放副作用。
- **自由交互 (react-rnd)**：集成 `react-rnd` (Rnd 组件)，实现全屏范围内无感的拖拽位移与缩放。
- **组件实现**：
    - `LyricsWindow.tsx`：沉浸式全屏歌词窗，支持**点击歌词跳转时间戳 (Seek-on-Click)**。
    - `PlaylistWindow.tsx`：播放列表浮窗，基于 FreeWindow 搭建。

### 7.2 技术规格与质量检测 (Audio Analysis)
- **音质分级逻辑**：
    - **Lossless**：FLAC, WAV, ALAC, AIFF, Monkey's Audio。
    - **Hi-Res**：Bitrate > 320kbps 或 Sample Rate > 48kHz。
    - **HQ**：Bitrate > 128kbps (Miku Green Color Badge)。
    - **Standard**：Bitrate ≤ 128kbps (Gray Color Badge)。
- **元数据提取**：基于 `music-metadata` v11 实装比特率 (Bitrate)、采样率 (Sample Rate) 与原始 ID3 指向的 Album/Year/Codec 字段。

### 7.3 精致动效 (Premium Motion)
- **视窗弹跳 (Window Pop)**：
    - **曲线**：`cubic-bezier(0.34, 1.56, 0.64, 1)`。
    - **效果**：`scale(0.9) translateY(30px) -> scale(1) translateY(0)`，配合 `opacity` 实现呼吸感的开启体验。
- **交互回馈**：歌词选中项高亮背景与模糊滤镜同步更新，确保焦点明确。

### 7.4 动态配色规范 (Dynamic Color Protocol)
- **色域提取**：通过 Canvas 下采样 (10x10) 获取专辑封面主导色作为 `themeColor`。
- **亮度感应 (Luminance Sensing)**：
    - **公式**：`0.2126*R + 0.7152*G + 0.0722*B`。
    - **阈值**：亮度 > 140 时强制切换 `textColor` 为黑，否则为白。
- **组件同步**：全局 FreeWindow 窗口通过 props 实时同步 `textColor`，确保跨组件视觉统一。

---
*Updated by Antigravity Divine Engineer - 2026-03-22*

---

## 8. 歌词系统精修 (Lyrics System Refinement)

### 8.1 QQ音乐风格歌词展示
- **歌词窗口 (`LyricsWindow.tsx`)**：移除所有边框，采用纯透明无框风格。歌词显示基于透明度与字体缩放区分当前行/非当前行，无背景气泡，完全靠排版和大小差异传达层级。
- **主播放器单行歌词预览 (`LyricsPreview.tsx`)**：保留完整 DOM 节点列表（不按索引裁切），通过 `useEffect` + `scrollToActive` 实现流畅滚动动画，非焦点行通过 `opacity: 0 / height: 0` 隐藏以保留动效（CSS 过渡生效的前提是节点始终存在）。

### 8.2 统一自由窗口架构 (`FreeWindow.tsx`)
- **核心设计**：提取为可复用基础组件，集成 `react-rnd` (Rnd 组件) 实现拖拽 + 自定义 Resize Handle（四角/四边缩放）。
- **使用方**：`LyricsWindow`、`PlaylistWindow` 统一基于此组件搭建，确保样式无边框、交互一致。

---

## 9. 歌单系统 (Playlist Architecture)

- **数据层 (`music.ts`)**：`playlist` 数组预置测试曲目；`playNext(forced)` / `playPrev()` 同时支持随机 (Shuffle) 与循环 (Loop: one/all/none) 三种播放模式。
- **播放列表浮窗 (`PlaylistWindow.tsx`)**：基于 `FreeWindow`，显示待播队列；当前正在播放曲目高亮 + 动画闪烁；悬停显示"播放"图标，双击立即切换。
- **控制区**："循环"按钮旁新增"播放列表"切换按钮，二者成对排布于控制台右侧。

---

## 10. 设置模块 (Settings Module)

### 10.1 动态顶栏子导航
- **路由感知逻辑 (`MainLayout.tsx`)**：新增 `currentTabs` 计算逻辑，检测 `pathname.startsWith('/settings')` 并切换到设置专属的 7 个分类标签（本用户、Skyline 云盘、安全与隐私等），离开设置路由则恢复时间线标签。
- **视觉优化**：标签栏添加 `overflow-x-auto` 横向滚动。

### 10.2 本用户设置页 (`/settings/profile`)
- **头像/横幅分离布局**：`flex-col sm:flex-row` 响应式架构，头像卡片固定在左 (`w-48 shrink-0`)，横幅 Banner 填充右侧剩余空间 (`flex-1`)。
- **单行排版表单**：`flex flex-col gap-5 w-full` 强制所有表单字段独占一行。
- **账户危险区**：底部独立 `border-t` 分隔区，包含"清除缓存"和醒目的 `text-red-500` "登出此帐号"按钮。

---

## 11. 图标体系 (Icon System)

- **当前方案**：`@fluentui/react-icons` v2 (Fluent UI System Icons)。
- **调用方式**：`<Icon name="icon_name" fontSize={20} />` 封装组件。
- **覆盖范围**：100+ 图标，涵盖导航、操作、状态、媒体等类别。
- **优势**：React 原生组件，tree-shakable，TypeScript 类型安全，无需外部字体加载。

---

## 12. 图标持久化与后端缓存 (Icon Persistence & Backend Caching)

### 12.1 架构下沉 (Logic Migration)
- **Go 后端接管**：将图标代理与缓存逻辑迁移至 Go 后端 (`core`)。新增 `Asset` 模块统一处理远程资源的下载、MD5 哈希重命名与磁盘持久化。
- **高性能中转**：前端通过 `/api/asset/icon?url=...` 发起请求，Go 后端利用原生 `http` 客户端实现极速抓取。

### 12.2 跨项目资产共享 (Cross-Project Asset Storage)
- **存储对齐**：Go 后端利用相对路径直接将缓存文件写入前端项目文件夹。
- **离线韧性**：一旦图标下载完成，即便远程源失效，后端依然能从文件系统中秒级读取并返回。
---

*Updated by Antigravity Divine Engineer - 2026-04-04*

---

## 13. 初始化流程优化 (Initialization Flow Optimization)

### 13.1 问题诊断
- **症状**：Splash Screen 卡在 30% 无法进入页面
- **根因**：`system.ts` 中 `fetchHostInfo()` 调用 `/api/system/environment` 无超时设置，后端不可用时请求挂起
- **次要问题**：`fetchHostInfo` catch 块使用 `catch {}` 但内部引用未定义的 `err` 变量

### 13.2 解决方案
- **即时进页**：服务端不可用时，Splash Screen 秒进页面，页面内显示错误弹窗
- **后台获取**：主机信息改为后台异步获取，不阻塞初始化流程
- **心跳检测**：后端离线状态由 `checkBackendHealth` 心跳检测处理，触发 `AppErrorDialog` 弹窗

### 13.3 代码变更
```typescript
// 之前：同步等待，可能挂起
async function initSequence() {
  initProgress.value = 30
  await fetchHostInfo()  // 无超时，可能卡住
  initProgress.value = 100
}

// 现在：立即完成，后台获取 (Zustand)
initSequence: async () => {
  if (get().isInitialized) return
  set({ isInitialized: true, initProgress: 100 })
  get().fetchHostInfoWithTimeout()  // 后台异步
  // launchApp() 在条件满足时自动调用
}
```

### 13.4 错误代码系统
- `ERR 12201`：初始化失败（`ERROR_CODE_INIT_FAILED`）
- `ERR 12202`：网络超时（`ERROR_CODE_NETWORK_TIMEOUT`）

---

## 14. 路由缺失修复 (Missing Route Fixes)

### 14.1 问题
- 多个导航链接指向不存在的页面
- 部分组件被引用但不存在

### 14.2 已实现的页面
| 路由 | 页面 | 状态 |
|------|------|------|
| `/` | 时间线/欢迎 | ✅ 已实现 |
| `/post/[id]` | 帖子详情 | ✅ 已实现 |
| `/user/[id]` | 用户主页 | ✅ 已实现 |
| `/settings/*` | 设置 (7 子页面) | ✅ 已实现 |
| `/drive/*` | Skyline Drive (3 页面) | ✅ 已实现 |
| `/chat/*` | 聊天 (4 页面) | ✅ 已实现 |
| `/panel/*` | 管理面板 (15+ 页面) | ✅ 已实现 |
| `/about/*` | 关于 (4 页面) | ✅ 已实现 |
| `/bookmarks` | 书签/收藏 | ✅ 已实现 |
| `/topic/*` | 话题 | ✅ 已实现 |
| `/announcement` | 公告 | ✅ 已实现 |
| `/developer` | 开发者 + Termity | ✅ 已实现 |

### 14.3 SplashScreen 简化
- 移除重试按钮的"查看详细日志"功能
- 简化错误处理流程

### 14.4 事件监听 SSR 修复
```typescript
// React 方案：useEffect + cleanup
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => { /* ... */ }
  const handleMouseUp = () => { /* ... */ }
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  return () => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }
}, [])
```

---

## 15. 当前页面状态 (Current Page State)

### 15.1 已实现页面
- `/` - 时间线首页 / 欢迎页
- `/post/[id]` - 帖子详情
- `/user/[id]` - 用户主页
- `/settings/*` - 设置 (7 子页面)
- `/drive/*` - Skyline Drive (3 页面)
- `/chat/*` - 聊天 (4 页面)
- `/panel/*` - 管理面板 (15+ 页面)
- `/about/*` - 关于 (4 页面)
- `/bookmarks` - 书签/收藏
- `/topic/*` - 话题
- `/announcement` - 公告
- `/developer` - 开发者 + Termity 终端

### 15.2 占位页面（待开发）
- `/orgs` - 社团
- `/miniapp` - Mini App
- `/qrcode` - 多维码
- `/games` - 小游戏
- `/albums` - 图集
- `/achievements` - 成就

---

## 16. 已知问题与限制 (Known Issues)

### 16.1 网络相关
- GitHub 头像 URL 在开发环境可能 `ERR_NAME_NOT_RESOLVED`（DNS 解析失败）

### 16.2 未来优化方向
- 完善各占位页面的实际功能
- 实现社团系统 (`/orgs`)
- 实现 Mini App 平台
- 实现成就系统

---

*Updated by CyaniAgent - 2026-07-04 (Vue → React migration complete)*
