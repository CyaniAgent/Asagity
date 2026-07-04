"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMusicStore } from "@/stores/music";
import { useI18n } from "@/components/providers/I18nProvider";

export function LyricsWindow() {
  const { t } = useI18n();
  const lyrics = useMusicStore((s) => s.lyrics);
  const currentLyricIndex = useMusicStore((s) => s.currentLyricIndex);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const seek = useMusicStore((s) => s.seek);
  const textColor = useMusicStore((s) => s.textColor);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lyrics.length);
  }, [lyrics.length]);

  const scrollToActive = useCallback((index: number) => {
    const container = containerRef.current;
    const line = lineRefs.current[index];
    if (!container || !line) return;

    const top = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
    container.scrollTo({ top, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (currentLyricIndex === -1) return;
    scrollToActive(currentLyricIndex);
  }, [currentLyricIndex, scrollToActive]);

  return (
    <div className="flex flex-col h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl">
      {/* Track Info */}
      <div className="p-6 pb-2 shrink-0 flex items-center gap-4 bg-gradient-to-b from-black/20 to-transparent">
        <img
          src={currentTrack.albumArt}
          className="w-14 h-14 rounded-2xl object-cover shadow-lg"
          alt=""
        />
        <div className="flex flex-col overflow-hidden">
          <h2 className="text-lg font-black truncate" style={{ color: textColor }}>
            {currentTrack.title}
          </h2>
          <p className="text-[12px] font-bold truncate opacity-60" style={{ color: textColor }}>
            {currentTrack.artist || t("music.unknownArtist")}
          </p>
        </div>
      </div>

      {/* Lyrics List with Click-to-Seek */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-10 pb-20 pt-4 custom-scrollbar"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        {lyrics.length > 0 ? (
          <div className="flex flex-col gap-4">
            {lyrics.map((line, index) => {
              const isActive = currentLyricIndex === index;

              return (
                <div
                  key={index}
                  ref={(el) => { lineRefs.current[index] = el; }}
                  className="transition-all duration-500 cursor-pointer py-1 group relative origin-left"
                  style={{
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    opacity: isActive ? 1 : 0.4,
                    fontWeight: isActive ? 800 : 400,
                  }}
                  onClick={() => seek(line.timestamp)}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.opacity = "0.4";
                  }}
                >
                  {line.rawLines.map((subLine, subIdx) => (
                    <div
                      key={subIdx}
                      className="transition-colors duration-300"
                      style={{
                        color: textColor,
                        fontSize: subIdx === 0 ? "1.5rem" : "0.875rem",
                        opacity: subIdx === 0 ? 1 : 0.6,
                        marginTop: subIdx > 0 ? "0.25rem" : undefined,
                      }}
                    >
                      {subLine}
                    </div>
                  ))}
                  {/* Hover play indicator */}
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-sm opacity-50">▶</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-20 italic font-black uppercase tracking-[0.3em]">
            {t("music.noLyricalData")}
          </div>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none rounded-b-[30px]" />
    </div>
  );
}
