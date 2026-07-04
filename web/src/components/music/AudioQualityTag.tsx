"use client";

import { useMusicStore } from "@/stores/music";
import { Icon } from "@/components/ui/Icon";

const QUALITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "Hi-Res": { label: "Hi-Res", color: "text-amber-500", bg: "bg-amber-500/10" },
  Lossless: { label: "Lossless", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  HQ: { label: "HQ", color: "text-green-500", bg: "bg-green-500/10" },
  Standard: { label: "Standard", color: "text-blue-500", bg: "bg-blue-500/10" },
  Low: { label: "Low", color: "text-gray-400", bg: "bg-gray-400/10" },
  Unknown: { label: "Unknown", color: "text-gray-500", bg: "bg-gray-500/10" },
};

export function AudioQualityTag() {
  const audioQuality = useMusicStore((s) => s.audioQuality);
  const config = QUALITY_CONFIG[audioQuality] || QUALITY_CONFIG.Unknown;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${config.color} ${config.bg}`}
    >
      <Icon name="graphic_eq" fontSize={10} />
      {config.label}
    </span>
  );
}
