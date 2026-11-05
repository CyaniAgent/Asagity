"use client";

import { WelcomeBackground, type FocalPoint, type WelcomeBackgroundFit } from "./WelcomeBackground";
import { WelcomeActionPanel } from "./WelcomeActionPanel";

export interface WelcomeProps {
  /** Override background image path */
  backgroundSrc?: string;
  /** "cover" fills+crops, "contain" shows whole image with blur-fill bars */
  backgroundFit?: WelcomeBackgroundFit;
  /** Focal point 0–100, decides what survives a cover crop */
  backgroundFocalPoint?: FocalPoint;
}

/**
 * Welcome / Landing page for Asagity.
 *
 * Architecture:
 *   - Fully decoupled from Next.js — uses no `next/image`, `next/link`, or App Router APIs.
 *   - Composed of two independent, swappable sub-components:
 *       1. WelcomeBackground  — configurable static background with image crop/zoom
 *       2. WelcomeActionPanel — bottom-right instance card (identity + live status + CTA)
 *   - Real-time status pills merged INTO the panel (Q4 redesign); the top-right
 *     corner stays clear for the background art.
 *
 * Pure React + Zustand stores + Tailwind CSS.
 */
export function Welcome({
  backgroundSrc,
  backgroundFit,
  backgroundFocalPoint,
}: WelcomeProps) {
  return (
    <WelcomeBackground
      src={backgroundSrc}
      fit={backgroundFit}
      focalPoint={backgroundFocalPoint}
    >
      {/* ── Bottom-right: Action Panel (identity + status + CTA) ── */}
      <div className="absolute bottom-6 right-6 z-20">
        <WelcomeActionPanel />
      </div>

      {/* ── Center: Brand (reserved for future) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
        {/* Reserved for future centered logo / tagline */}
      </div>
    </WelcomeBackground>
  );
}
