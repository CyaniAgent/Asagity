"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMusicStore } from "@/stores/music";
import { useI18n } from "@/components/providers/I18nProvider";

export function LyricsPreview() {
  const { t } = useI18n();
  const lyrics = useMusicStore((s) => s.lyrics);
  const currentLyricIndex = useMusicStore((s) => s.currentLyricIndex);
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

  if (lyrics.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs opacity-20 italic">
        {t("music.noLyrics")}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-col overflow-hidden pointer-events-none relative scroll-smooth"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        }}
      >
        <div className="flex flex-col gap-3 py-8">
          {lyrics.map((line, index) => {
            const isActive = index === currentLyricIndex;
            const isNear = Math.abs(index - currentLyricIndex) === 1;

            return (
              <div
                key={index}
                ref={(el) => { lineRefs.current[index] = el; }}
                className="transition-all duration-700 flex flex-col items-center transform-gpu"
                style={{
                  opacity: isActive ? 1 : isNear ? 0.3 : 0,
                  transform: isActive ? "scale(1.1)" : "scale(0.75)",
                  filter: isNear ? "blur(0.5px)" : isActive ? "none" : "blur(4px)",
                  fontWeight: isActive ? 800 : isNear ? 700 : 400,
                  willChange: "transform, opacity, filter",
                }}
              >
                <div className="flex flex-col items-center w-full text-center py-1">
                  {line.rawLines.map((subLine, subIdx) => (
                    <div
                      key={subIdx}
                      className="leading-tight drop-shadow-lg antialiased transition-all duration-700"
                      style={{
                        color: textColor,
                        fontSize: isActive
                          ? subIdx === 0 ? "1.25rem" : "0.875rem"
                          : subIdx === 0 ? "1rem" : "0.75rem",
                        fontWeight: isActive ? 900 : 700,
                        opacity: isActive
                          ? subIdx === 0 ? 1 : 0.8
                          : subIdx === 0 ? 0.7 : 0.4,
                        marginTop: subIdx > 0 ? "0.25rem" : undefined,
                      }}
                    >
                      {subLine}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
