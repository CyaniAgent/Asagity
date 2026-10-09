"use client";

import { WelcomeBackground, type FocalPoint, type WelcomeBackgroundFit } from "./WelcomeBackground";
import { WelcomeStatusBar } from "./WelcomeStatusBar";
import { WelcomeActionPanel } from "./WelcomeActionPanel";
import type { StatusItem } from "./WelcomeStatusBar";

export interface WelcomeProps {
  /** Override background image path */
  backgroundSrc?: string;
  /** "cover" fills+crops, "contain" shows whole image with blur-fill bars */
  backgroundFit?: WelcomeBackgroundFit;
  /** Focal point 0–100, decides what survives a cover crop */
  backgroundFocalPoint?: FocalPoint;
  /** Override status bar items */
  statusItems?: StatusItem[];
}

/**
 * Welcome / Landing page for Asagity.
 *
 * Architecture:
 *   - Fully decoupled from Next.js — uses no `next/image`, `next/link`, or App Router APIs.
 *   - Composed of three independent, swappable sub-components:
 *       1. WelcomeBackground  — configurable static background with image crop/zoom
 *       2. WelcomeStatusBar   — top-right status indicators (theme-aware)
 *       3. WelcomeActionPanel — bottom-right info + action buttons (themed container)
 *   - All sub-components accept override props for full customization.
 *
 * Pure React + Zustand stores + Tailwind CSS.
 */
export function Welcome({
  backgroundSrc,
  backgroundFit,
  backgroundFocalPoint,
  statusItems,
}: WelcomeProps) {
  return (
    <WelcomeBackground
      src={backgroundSrc}
      fit={backgroundFit}
      focalPoint={backgroundFocalPoint}
    >
      {/* ── Top-right: Status Bar ── */}
      <div className="absolute top-5 right-6 z-20">
        <WelcomeStatusBar items={statusItems} />
      </div>

      {/* ── Bottom-right: Action Panel ── */}
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
