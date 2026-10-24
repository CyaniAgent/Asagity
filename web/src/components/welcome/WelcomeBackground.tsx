"use client";

import { useEffect, useRef, useState } from "react";
import { resolveCrop } from "./resolveCrop";

export type WelcomeBackgroundFit = "cover" | "contain";

export interface FocalPoint {
  /** Horizontal focus 0–100 (percent). */
  x: number;
  /** Vertical focus 0–100 (percent). */
  y: number;
}

export interface WelcomeBackgroundProps {
  /** Background image path (relative to public/ or absolute URL) */
  src?: string;
  /** Fallback gradient if image fails to load */
  fallbackGradient?: string;
  /** CSS object-position for crop focus, e.g. "center top" or "50% 30%" */
  objectPosition?: string;
  /** Focal point 0–100 — wins over objectPosition when provided. */
  focalPoint?: FocalPoint;
  /**
   * "cover" fills the viewport (crops overflow, focalPoint decides what survives).
   * "contain" shows the whole image; empty bars are filled by a blurred copy
   * of the same image (same technique as MusicPlayer's cover-glass backdrop).
   */
  fit?: WelcomeBackgroundFit;
  /** CSS scale for zoom, e.g. 1.15 */
  scale?: number;
  /** Render the blurred fill layer in contain mode. Default true. */
  blurFill?: boolean;
  children?: React.ReactNode;
}

const DEFAULT_BG = "/images/background/default.jpg";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #0a0a1a 0%, #0f1b2d 30%, #0a1628 60%, #0d0d1a 100%)";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export function WelcomeBackground({
  src = DEFAULT_BG,
  fallbackGradient = DEFAULT_GRADIENT,
  objectPosition = "center",
  focalPoint,
  fit = "cover",
  scale = 1.0,
  blurFill = true,
  children,
}: WelcomeBackgroundProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Measure the render box once mounted; re-resolve on resize.
  // JS only decides the position — scaling/cropping stays on CSS cover.
  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) =>
        prev && prev.width === r.width && prev.height === r.height
          ? prev
          : { width: r.width, height: r.height },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const legacyPosition = focalPoint
    ? `${clamp(focalPoint.x)}% ${clamp(focalPoint.y)}%`
    : objectPosition;
  const contain = fit === "contain";
  // Guaranteed-visible focal crop (cover only; contain never overflows).
  // Falls back to the legacy percentage until sizes are measured.
  const resolved =
    !contain && focalPoint && natural && box
      ? resolveCrop(box, natural, focalPoint)
      : null;
  const position = resolved ? `${resolved.x}% ${resolved.y}%` : legacyPosition;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] text-white font-sans">
      {/* Layer 0: Fallback gradient (always behind) */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: fallbackGradient }}
      />

      {/* Layer 1: background image(s) */}
      {!imgError && (
        <div ref={layerRef} className="absolute inset-0 z-[1]">
          {/* Blur-fill layer (contain mode): same image, blown up + blurred,
              covers the letterbox bars left by `contain`. */}
          {contain && blurFill && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              aria-hidden="true"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: "cover",
                objectPosition: position,
                transform: "scale(1.25)",
                filter: "blur(80px) brightness(0.55) saturate(1.5)",
              }}
            />
          )}
          {/* Main layer: cover crops via focalPoint, contain shows it whole */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setNatural({ width: img.naturalWidth, height: img.naturalHeight });
              }
              setImgLoaded(true);
            }}
            onError={() => setImgError(true)}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{
              objectFit: contain ? "contain" : "cover",
              objectPosition: position,
              transform: `scale(${scale})`,
            }}
          />
        </div>
      )}

      {/* Content layer — no overlay, no vignette, background at full brightness */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
