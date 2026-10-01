/**
 * MusicPlayer App — React client entry (AAP v2).
 *
 * 迁移策略（过渡期）：
 * 1. 本文件暂时 re-export 宿主现有的内置实现，保持行为零回归；
 * 2. 待 App 沙箱 loader 就绪后，把 `web/src/stores/music.ts` 与
 *    `web/src/components/music/*` 整体搬入本目录，删除 re-export；
 * 3. 音质分档规则以 `core/src/Verse.Modules/Verse.Module.Music/MusicModule.cs`
 *    的四档（Lossless / Hi-Res / HQ / Standard）为准，客户端不再自创规则。
 */
export { MusicPlayer } from "@/components/music/MusicPlayer";
export { useMusicStore } from "@/stores/music";
export type { Track, LyricLine } from "@/stores/music";
