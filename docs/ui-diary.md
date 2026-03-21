# Asagity SSS-Rank UI Diary

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
    - UI 文字：`MiSans` (全能中文字库)。
    - 代码/等宽：`JetBrains Mono`。
- **API 通信**：
    - 状态管理：Pinia (`stores/`)。
    - 音频元数据：`music-metadata` v11 (Blob 原生解析)。

---
## 7. 动态自由窗口系统 (Dynamic Free Window System)

### 7.1 架构原理
- **容器脱离 (Teleport)**：自由窗口通过 `<Teleport to="body">` 渲染，完全隔离 `Split View` 容器的尺寸变化及缩放副作用，解决详情页频繁重绘导致的 UI 抖动。
- **自由交互 (useDraggable)**：集成 `@vueuse/core`，实现全屏范围内无感的拖拽位移。
- **组件实现**：
    - `MusicLyricsWindow.vue`：沉浸式全屏歌词窗，支持**点击歌词跳转时间戳 (Seek-on-Click)**。
    - `MusicInfoWindow.vue`：高保真音频流分析窗。

### 7.2 技术规格与质量检测 (Audio Analysis)
- **音质分级逻辑**：
    - **Lossless**：FLAC, WAV, ALAC, AIFF, Monkey's Audio。
    - **MP3 HQ**：Bitrate > 128kbps (Miku Green Color Badge)。
    - **MP3 Normal**：Bitrate ≤ 128kbps (Gray Color Badge)。
- **元数据提取**：基于 `music-metadata` v11 实装比特率 (Bitrate)、采样率 (Sample Rate) 与原始 ID3 指向的 Album/Year/Codec 字段。

### 7.3 精致动效 (Premium Motion)
- **视窗弹跳 (Window Pop)**：
    - **曲线**：`cubic-bezier(0.34, 1.56, 0.64, 1)`。
    - **效果**：`scale(0.9) translateY(30px) -> scale(1) translateY(0)`，配合 `opacity` 实现呼吸感的开启体验。
- **交互回馈**：歌词选中项高亮背景与模糊滤镜同步更新，确保焦点明确。

---
*Updated by Antigravity Divine Engineer - 2026-03-21*
