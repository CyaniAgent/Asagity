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
*Created by Antigravity Divine Engineer*
