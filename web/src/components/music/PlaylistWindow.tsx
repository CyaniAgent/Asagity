"use client";

import { useMusicStore } from "@/stores/music";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export function PlaylistWindow() {
  const { t } = useI18n();
  const playlist = useMusicStore((s) => s.playlist);
  const currentIndex = useMusicStore((s) => s.currentIndex);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const setTrackByIndex = useMusicStore((s) => s.setTrackByIndex);
  const textColor = useMusicStore((s) => s.textColor);
  const themeColor = useMusicStore((s) => s.themeColor);

  return (
    <div className="flex flex-col h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 pb-2 shrink-0 border-b border-gray-200/50 dark:border-white/5">
        <h3 className="text-sm font-semibold" style={{ color: textColor }}>
          {t("music.playlistQueue")} ({playlist.length})
        </h3>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
        <div className="flex flex-col gap-1">
          {playlist.map((track, index) => {
            const isActive = currentIndex === index;

            return (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: isActive ? `${themeColor}22` : undefined,
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
                  {/* Index / Playing indicator */}
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isActive && isPlaying ? (
                      <span className="animate-pulse" style={{ color: themeColor }}>
                        <Icon name="volume_up" fontSize={14} />
                      </span>
                    ) : (
                      <span
                        className="text-[10px] font-normal"
                        style={{
                          color: isActive ? themeColor : textColor,
                          opacity: isActive ? 1 : 0.4,
                        }}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className="text-xs font-normal truncate"
                      style={{
                        color: isActive ? themeColor : textColor,
                      }}
                    >
                      {track.title}
                    </span>
                    <span
                      className="text-[9px] font-normal truncate mt-0.5"
                      style={{
                        color: textColor,
                        opacity: 0.45,
                      }}
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
  );
}
