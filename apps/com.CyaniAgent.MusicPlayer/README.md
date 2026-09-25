# com.CyaniAgent.MusicPlayer

从内置组件独立出来的音乐迷你 App（AAP v2 目录形态骨架）。

## 来源

- 后端：`core/src/Verse.Modules/Verse.Module.Music/MusicModule.cs`（仅 `GET /api/music/quality-tags`，Lossless / Hi-Res / HQ / Standard 四档）。
- 前端：`web/src/stores/music.ts`（`useMusicStore`，播放/歌词/循环/音量）+ `web/src/components/music/MusicPlayer.tsx`（320px 毛玻璃卡片）。

独立策略：前端先整体搬入 `client/`，后端保持 `server: none`，音质标签走 `bridge/routes.json` 声明式代理到宿主现有的核心模块；过渡期结束后再决定是否要独立 sidecar。

## 目录

- `manifest.json`：只做索引，权限/事件/插槽/配置全部引用 `config/*.json`。
- `config/`：各类别 Source of Truth。
- `client/index.tsx`：React 入口，迁移期 re-export 宿主实现。
- `widgets/player/`：播放器小组件声明。
- `bridge/routes.json`：声明式路由代理。
- `assets/ + locales/`：图标与三语言文案。
