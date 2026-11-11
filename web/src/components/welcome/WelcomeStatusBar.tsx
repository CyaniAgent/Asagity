"use client";

import { useMemo } from "react";
import { useSystemStore } from "@/stores/system";
import { useWelcomeStore } from "@/stores/welcome";
import { useI18n } from "@/components/providers/I18nProvider";
import type { InstanceStats } from "./useInstanceMeta";
import type { WelcomeStatusItemConfig } from "./welcomeConfig";

export interface StatusItem {
  label: string;
  value: string;
  /** "green" = real live value, "gray" = unknown (backend field missing), "red" = offline */
  status?: "green" | "gray" | "red";
  /** "count" = promoted to the big stat strip above the panel (hidden from chips) */
  kind?: "count" | "status";
}

/**
 * Resolves the store's status config with live values.
 * Shared by the welcome panel's internal chips (and the big stat strip).
 * `stats` is injected by the caller (the panel already polls via useInstanceMeta).
 *
 * 旧 `WelcomeStatusBar` / `StatusPills` 展示组件已删除（design-standard §6 P2-9）：
 * 无消费方的死代码，且带原始色板与手动 isDark 分支（违反铁律 1）。
 */
export function useWelcomeStatusItems(stats: InstanceStats): StatusItem[] {
  const { t } = useI18n();
  const storeItems = useWelcomeStore((s) => s.statusItems);
  const isBackendOnline = useSystemStore((s) => s.isBackendOnline);

  return useMemo(
    () =>
      storeItems.map((item) =>
        resolveStatusItem(item, { t, online: stats.online, isBackendOnline })
      ),
    [storeItems, stats.online, isBackendOnline, t]
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
      return { label, value: item.source.value, status: item.source.status, kind: "status" };
    case "onlineCount":
      // No backend field yet → "—" (rendered "—" in the big strip too, gray until live).
      return ctx.online == null
        ? { label, value: "—", status: "gray", kind: "count" }
        : { label, value: ctx.online, status: "green", kind: "count" };
    case "backend":
      return {
        label,
        value: ctx.isBackendOnline ? ctx.t("welcome.verseNETNormal") : ctx.t("welcome.verseNETDisconnected"),
        status: ctx.isBackendOnline ? "green" : "red",
        kind: "status",
      };
  }
}
