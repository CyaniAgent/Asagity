"use client";

import { useMemo } from "react";
import { useSystemStore } from "@/stores/system";
import { useWelcomeStore } from "@/stores/welcome";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "@/components/providers/I18nProvider";
import { useInstanceMeta } from "./useInstanceMeta";
import type { WelcomeStatusItemConfig } from "./welcomeConfig";

export interface StatusItem {
  label: string;
  value: string;
  /** "green" = real live value, "gray" = unknown (backend field missing), "red" = offline */
  status?: "green" | "gray" | "red";
}

export interface WelcomeStatusBarProps {
  /** Full override (legacy prop) — wins over store config when provided. */
  items?: StatusItem[];
}

/** Top-right status bar for the Welcome page. Data-driven: layout from useWelcomeStore.statusItems. */
export function WelcomeStatusBar({ items }: WelcomeStatusBarProps) {
  const isDark = useThemeStore(
    (s) => s.preference === "dark" || (s.preference === "system" && s.systemPreference === "dark")
  );
  const resolved = useWelcomeStatusItems();
  return <StatusPills items={items ?? resolved} isDark={isDark} />;
}

/**
 * Resolves the store's status config with live values.
 * Shared by the floating status bar AND the welcome panel's internal status row.
 */
export function useWelcomeStatusItems(): StatusItem[] {
  const { t } = useI18n();
  const storeItems = useWelcomeStore((s) => s.statusItems);
  const isBackendOnline = useSystemStore((s) => s.isBackendOnline);
  const online = useInstanceMeta();

  return useMemo(
    () =>
      storeItems.map((item) =>
        resolveStatusItem(item, { t, online, isBackendOnline })
      ),
    [storeItems, online, isBackendOnline, t]
  );
}

function resolveStatusItem(
  item: WelcomeStatusItemConfig,
  ctx: { t: (k: string) => string; online: string | null; isBackendOnline: boolean }
): StatusItem {
  // labelKey may itself be a literal (e.g. "Verse NET") — t() falls back to key.
  const label = ctx.t(item.labelKey);
  switch (item.source.kind) {
    case "static":
      return { label, value: item.source.value, status: item.source.status };
    case "onlineCount":
      // No backend field yet → "—" + gray; never fake a live number.
      return ctx.online == null
        ? { label, value: "—", status: "gray" }
        : { label, value: ctx.online, status: "green" };
    case "backend":
      return {
        label,
        value: ctx.isBackendOnline ? ctx.t("welcome.verseNETNormal") : ctx.t("welcome.verseNETDisconnected"),
        status: ctx.isBackendOnline ? "green" : "red",
      };
  }
}

export function StatusPills({ items, isDark }: { items: StatusItem[]; isDark: boolean }) {
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
