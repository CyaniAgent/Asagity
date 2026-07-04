"use client";

import { useEffect, useCallback, useState } from "react";
import { useMusicStore } from "@/stores/music";
import { LyricsPreview } from "./LyricsPreview";
import { AudioQualityTag } from "./AudioQualityTag";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === null) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const { t } = useI18n();
  const initAudio = useMusicStore((s) => s.initAudio);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const progress = useMusicStore((s) => s.progress);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isLoading = useMusicStore((s) => s.isLoading);
  const shuffle = useMusicStore((s) => s.shuffle);
  const loopMode = useMusicStore((s) => s.loopMode);
  const playlist = useMusicStore((s) => s.playlist);
  const currentIndex = useMusicStore((s) => s.currentIndex);
  const isLyricsWindowOpen = useMusicStore((s) => s.isLyricsWindowOpen);
  const isPlaylistWindowOpen = useMusicStore((s) => s.isPlaylistWindowOpen);
  const themeColor = useMusicStore((s) => s.themeColor);
  const textColor = useMusicStore((s) => s.textColor);
  const progressPercentage = useMusicStore((s) => s.progressPercentage);

  const togglePlay = useMusicStore((s) => s.togglePlay);
  const seek = useMusicStore((s) => s.seek);
  const setProgress = useMusicStore((s) => s.setProgress);
  const toggleShuffle = useMusicStore((s) => s.toggleShuffle);
  const toggleLoopMode = useMusicStore((s) => s.toggleLoopMode);
  const playNext = useMusicStore((s) => s.playNext);
  const playPrev = useMusicStore((s) => s.playPrev);
  const setTrackByIndex = useMusicStore((s) => s.setTrackByIndex);

  const [showPlaylist, setShowPlaylist] = useState(false);

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  const handleStop = useCallback(() => {
    seek(0);
    if (isPlaying) togglePlay();
  }, [seek, isPlaying, togglePlay]);

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProgress(parseFloat(e.target.value));
    },
    [setProgress]
  );

  return (
    <div
      className="relative w-[320px] max-w-full rounded-[28px] overflow-hidden font-sans select-none border border-white/10 dark:border-gray-800/80 shadow-2xl flex flex-col transition-all duration-500 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl"
      style={{ "--theme-color": themeColor, "--text-color": textColor } as React.CSSProperties}
    >
      {/* Dynamic Album Art Blurred Background */}
      <div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: themeColor }}
      >
        <img
          src={currentTrack.albumArt}
          className="w-full h-full object-cover scale-150 blur-[80px] opacity-25 dark:opacity-35 transition-all duration-1000"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 dark:via-black/5 dark:to-black/10" />
      </div>

      {/* Core Content */}
      <div className="relative z-10 p-5 flex flex-col">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-40 flex items-center justify-center rounded-[28px]">
            <div className="flex flex-col items-center gap-3">
              <Icon name="refresh" className="w-8 h-8 text-cyan-500 animate-spin" fontSize={32} />
              <p className="text-[10px] font-normal tracking-widest text-gray-900/50 dark:text-white/70 uppercase">
                {t("music.loading")}
              </p>
            </div>
          </div>
        )}

        {/* Top Section: Album Cover & Track Info */}
        <div className="flex items-center gap-3.5 mb-4">
          {/* Rotating Cover */}
          <div className="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-black/5 dark:border-white/10">
            <img
              src={currentTrack.albumArt}
              className="w-full h-full object-cover origin-center"
              alt={t("music.cover")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-base font-normal truncate leading-tight"
              style={{ color: textColor }}
            >
              {currentTrack.title}
            </h1>
            <p
              className="text-xs font-normal truncate mt-1"
              style={{ color: `${textColor}99` }}
            >
              {currentTrack.artist || t("music.unknownArtist")}
            </p>
            <div className="mt-1">
              <AudioQualityTag />
            </div>
          </div>
        </div>

        {/* Lyrics Preview (Single Line) */}
        <div className="mb-3 h-8 overflow-hidden">
          <LyricsPreview />
        </div>

        {/* Progress Section */}
        <div className="w-full mb-4 space-y-1.5">
          <div className="relative w-full h-1 bg-gray-900/5 dark:bg-white/10 rounded-full group cursor-pointer">
            <input
              type="range"
              min={0}
              max={currentTrack.duration || 100}
              value={progress}
              step={0.1}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(57,197,187,0.6)]"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: themeColor,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-normal" style={{ color: `${textColor}73` }}>
            <span>{formatTime(progress)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="w-full flex items-center justify-between gap-1 mb-1">
          {/* Shuffle */}
          <button
            className={`w-7 h-7 inline-flex items-center justify-center rounded-full transition-all duration-200 ${
              shuffle ? "bg-cyan-500/22 shadow-[0_0_8px_rgba(57,197,187,0.2)]" : ""
            }`}
            style={{ color: shuffle ? textColor : `${textColor}99` }}
            title={t("music.shuffle")}
            onClick={toggleShuffle}
          >
            <Icon name="shuffle" fontSize={16} />
          </button>

          {/* Previous */}
          <button
            className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-all duration-200"
            style={{ color: `${textColor}99` }}
            title={t("music.previous")}
            onClick={playPrev}
            onMouseEnter={(e) => { e.currentTarget.style.color = textColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = `${textColor}99`; }}
          >
            <Icon name="skip_previous" fontSize={20} />
          </button>

          {/* Play/Pause */}
          <button
            className="w-11 h-11 inline-flex items-center justify-center rounded-full transition-all duration-300 shadow-lg hover:scale-108 active:scale-92"
            style={{
              backgroundColor: themeColor,
              color: textColor,
              boxShadow: `0 4px 12px ${themeColor}59`,
            }}
            title={t("music.playPause")}
            onClick={togglePlay}
          >
            <Icon
              name={isPlaying ? "pause" : "play_arrow"}
              fontSize={24}
              className={!isPlaying ? "translate-x-[1px]" : ""}
            />
          </button>

          {/* Stop */}
          <button
            className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-all duration-200"
            style={{ color: `${textColor}99` }}
            title={t("music.stop")}
            onClick={handleStop}
            onMouseEnter={(e) => { e.currentTarget.style.color = textColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = `${textColor}99`; }}
          >
            <Icon name="stop_rounded" fontSize={20} />
          </button>

          {/* Next */}
          <button
            className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-all duration-200"
            style={{ color: `${textColor}99` }}
            title={t("music.next")}
            onClick={() => playNext(false)}
            onMouseEnter={(e) => { e.currentTarget.style.color = textColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = `${textColor}99`; }}
          >
            <Icon name="skip_next" fontSize={20} />
          </button>

          {/* Loop Mode */}
          <button
            className={`w-7 h-7 inline-flex items-center justify-center rounded-full transition-all duration-200 ${
              loopMode !== "none" ? "bg-cyan-500/22 shadow-[0_0_8px_rgba(57,197,187,0.2)]" : ""
            }`}
            style={{ color: loopMode !== "none" ? textColor : `${textColor}99` }}
            title={loopMode === "one" ? t("music.loopOne") : loopMode === "all" ? t("music.loopAll") : t("music.noLoop")}
            onClick={toggleLoopMode}
          >
            <Icon name={loopMode === "one" ? "repeat_one" : "repeat"} fontSize={16} />
          </button>

          {/* Lyrics Window Toggle */}
          <button
            className={`w-7 h-7 inline-flex items-center justify-center rounded-full transition-all duration-200 ${
              isLyricsWindowOpen ? "bg-cyan-500/22 shadow-[0_0_8px_rgba(57,197,187,0.2)]" : ""
            }`}
            style={{ color: isLyricsWindowOpen ? textColor : `${textColor}99` }}
            title={t("music.desktopLyrics")}
            onClick={() => useMusicStore.setState({ isLyricsWindowOpen: !isLyricsWindowOpen })}
          >
            <Icon name="lyrics" fontSize={16} />
          </button>

          {/* Playlist Toggle */}
          <button
            className={`w-7 h-7 inline-flex items-center justify-center rounded-full transition-all duration-200 ${
              isPlaylistWindowOpen ? "bg-cyan-500/22 shadow-[0_0_8px_rgba(57,197,187,0.2)]" : ""
            }`}
            style={{ color: isPlaylistWindowOpen ? textColor : `${textColor}99` }}
            title={t("music.playlistQueue")}
            onClick={() => {
              const next = !isPlaylistWindowOpen;
              useMusicStore.setState({ isPlaylistWindowOpen: next });
              setShowPlaylist(next);
            }}
          >
            <Icon name="queue_music" fontSize={16} />
          </button>
        </div>

        {/* Collapsible Playlist Queue */}
        <div
          className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            maxHeight: showPlaylist ? "192px" : "0px",
            opacity: showPlaylist ? 1 : 0,
            transform: showPlaylist ? "translateY(0)" : "translateY(-8px)",
          }}
        >
          <div className="mt-4 pt-4 border-t border-gray-900/5 dark:border-white/5 flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar select-none">
            {playlist.map((track, index) => {
              const isActive = currentIndex === index;

              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? `${themeColor}22` : undefined,
                    color: textColor,
                  }}
                  onClick={() => setTrackByIndex(index)}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = `${textColor}08`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden w-full">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {isActive && isPlaying ? (
                        <span className="animate-pulse" style={{ color: themeColor }}>
                          <Icon name="volume_up" className="w-4 h-4" fontSize={16} />
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-normal opacity-40"
                          style={{ color: textColor }}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-xs font-normal truncate"
                        style={{ color: isActive ? themeColor : textColor }}
                      >
                        {track.title}
                      </span>
                      <span
                        className="text-[9px] font-normal truncate mt-0.5"
                        style={{ color: textColor, opacity: 0.45 }}
                      >
                        {track.artist || t("music.localTrack")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
