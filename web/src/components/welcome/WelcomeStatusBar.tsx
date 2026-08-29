"use client";

import { useSystemStore } from "@/stores/system";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "@/components/providers/I18nProvider";

export interface StatusItem {
  label: string;
  value: string;
  /** "green" = online pulse, "gray" = neutral, "red" = offline */
  status?: "green" | "gray" | "red";
}

export interface WelcomeStatusBarProps {
  items?: StatusItem[];
}

/**
 * Top-right status bar for the Welcome page.
 * Shows online users (green pulse dot + count) and Verse NET status.
 * Theme-aware: syncs text/border colors with dark/light mode.
 *
 * Pure React — no Next.js dependency.
 */
export function WelcomeStatusBar({ items }: WelcomeStatusBarProps) {
  const { t } = useI18n();
  const isBackendOnline = useSystemStore((s) => s.isBackendOnline);
  const isDark = useThemeStore(
    (s) => s.preference === "dark" || (s.preference === "system" && s.systemPreference === "dark")
  );

  const defaultItems: StatusItem[] = [
    {
      label: t("welcome.online"),
      value: "1",
      status: "green",
    },
    {
      label: "Verse NET",
      value: isBackendOnline ? t("welcome.verseNETNormal") : t("welcome.verseNETDisconnected"),
      status: isBackendOnline ? "green" : "red",
    },
  ];

  const displayItems = items ?? defaultItems;

  return (
    <div className="flex items-center gap-3">
      {displayItems.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md
            ${isDark
              ? "bg-white/10 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              : "bg-white border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            }`}
        >
          {/* Status dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            {item.status === "green" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                item.status === "green"
                  ? "bg-emerald-400"
                  : item.status === "red"
                    ? "bg-red-400"
                    : "bg-gray-400"
              }`}
            />
          </span>

          {/* Label */}
          <span className={`text-[11px] font-medium tracking-wide ${isDark ? "text-white/70" : "text-gray-500"}`}>
            {item.label}
          </span>
          {/* Value */}
          <span className={`text-[12px] font-semibold tabular-nums ${isDark ? "text-white" : "text-gray-900"}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
