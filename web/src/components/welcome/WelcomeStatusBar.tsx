"use client";

import { useSystemStore } from "@/stores/system";
import { useWelcomeStore } from "@/stores/welcome";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "@/components/providers/I18nProvider";
import { useOnlineCount } from "./useOnlineCount";
import type { WelcomeStatusItemConfig } from "./welcomeConfig";

export interface StatusItem {
  label: string;
  value: string;
  /** "green" = online pulse, "gray" = neutral, "red" = offline */
  status?: "green" | "gray" | "red";
}

export interface WelcomeStatusBarProps {
  /** Full override (legacy prop) — wins over store config when provided. */
  items?: StatusItem[];
}

/**
 * Top-right status bar for the Welcome page.
 * Data-driven: layout comes from useWelcomeStore.statusItems,
 * live values resolve per-item (onlineCount polls backend,
 * backend pill reads the dual-backend heartbeat).
 */
export function WelcomeStatusBar({ items }: WelcomeStatusBarProps) {
  const { t } = useI18n();
  const storeItems = useWelcomeStore((s) => s.statusItems);
  const isBackendOnline = useSystemStore((s) => s.isBackendOnline);
  const isDark = useThemeStore(
    (s) => s.preference === "dark" || (s.preference === "system" && s.systemPreference === "dark")
  );
  const onlineCount = useOnlineCount();

  if (items) return <StatusPills items={items} isDark={isDark} />;

  const resolved: StatusItem[] = storeItems.map((item) =>
    resolveStatusItem(item, { t, onlineCount, isBackendOnline })
  );

  return <StatusPills items={resolved} isDark={isDark} />;
}

function resolveStatusItem(
  item: WelcomeStatusItemConfig,
  ctx: { t: (k: string) => string; onlineCount: string; isBackendOnline: boolean }
): StatusItem {
  // labelKey may itself be a literal (e.g. "Verse NET") — t() falls back to key.
  const label = ctx.t(item.labelKey);
  switch (item.source.kind) {
    case "static":
      return { label, value: item.source.value, status: item.source.status };
    case "onlineCount":
      return { label, value: ctx.onlineCount, status: "green" };
    case "backend":
      return {
        label,
        value: ctx.isBackendOnline ? ctx.t("welcome.verseNETNormal") : ctx.t("welcome.verseNETDisconnected"),
        status: ctx.isBackendOnline ? "green" : "red",
      };
  }
}

function StatusPills({ items, isDark }: { items: StatusItem[]; isDark: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {items.map((item) => (
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
