"use client";

import { useState } from "react";

export interface WelcomeBackgroundProps {
  /** Background image path (relative to public/ or absolute URL) */
  src?: string;
  /** Fallback gradient if image fails to load */
  fallbackGradient?: string;
  /** CSS object-position for crop focus, e.g. "center top" or "50% 30%" */
  objectPosition?: string;
  /** CSS scale for zoom, e.g. 1.15 */
  scale?: number;
  children?: React.ReactNode;
}

const DEFAULT_BG = "/images/background/welcome-page-default.png";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #0a0a1a 0%, #0f1b2d 30%, #0a1628 60%, #0d0d1a 100%)";

export function WelcomeBackground({
  src = DEFAULT_BG,
  fallbackGradient = DEFAULT_GRADIENT,
  objectPosition = "center",
  scale = 1.0,
  children,
}: WelcomeBackgroundProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] text-white font-sans">
      {/* Layer 0: Fallback gradient (always behind) */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: fallbackGradient }}
      />

      {/* Layer 1: Static background image — full brightness, crop/zoom via CSS */}
      {!imgError && (
        <div className="absolute inset-0 z-[1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{
              objectFit: "cover",
              objectPosition,
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
