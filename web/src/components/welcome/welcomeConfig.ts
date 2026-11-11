"use client";

import type { ViewType } from "@/types/windows";

/** Menu action after data-driven refactor (Q4: window + link). */
export type WelcomeMenuAction =
  | { kind: "window"; viewType: ViewType }
  | { kind: "link"; href: string; external?: boolean }
  | { kind: "none" };

export interface WelcomeMenuItemConfig {
  id: string;
  icon: string;
  /** i18n key, e.g. "welcome.browseTimeline" */
  labelKey: string;
  action: WelcomeMenuAction;
  /**
   * Kept visible but disabled (Q3). The disabled state itself (opacity +
   * cursor-not-allowed + aria-disabled) carries "in development" — no badge
   * (design rule 4: decorative badges are redundant).
   */
  comingSoon?: boolean;
  small?: boolean;
  children?: WelcomeMenuItemConfig[];
}

export interface WelcomeMenuGroupConfig {
  id: string;
  items: WelcomeMenuItemConfig[];
}

/** StatusBar item with pluggable data source (Q2: heartbeat + real online count). */
export type WelcomeStatusSource =
  | { kind: "static"; value: string; status: "green" | "gray" | "red" }
  | { kind: "onlineCount" }
  | { kind: "backend" };

export interface WelcomeStatusItemConfig {
  id: string;
  labelKey: string;
  labelFallback?: string;
  source: WelcomeStatusSource;
}

export const DEFAULT_MENU_GROUPS: WelcomeMenuGroupConfig[] = [
  {
    id: "quick",
    items: [
      // timeline 已提升为 WelcomeActionPanel 的显性入口行 — 不再重复挂进菜单
      {
        id: "announcements",
        icon: "campaign",
        labelKey: "announcement.announcements",
        action: { kind: "none" },
        comingSoon: true,
      },
    ],
  },
  {
    id: "instance",
    items: [
      {
        id: "about",
        icon: "info",
        labelKey: "welcome.aboutInstance",
        // legacy behavior opened the timeline window — keep until about page lands
        action: { kind: "window", viewType: "welcome_timeline" },
      },
      {
        id: "system-info",
        icon: "server",
        labelKey: "welcome.systemInfo",
        action: { kind: "window", viewType: "system_info" },
      },
      {
        id: "federation",
        icon: "globe",
        labelKey: "welcome.federation",
        action: { kind: "none" },
        comingSoon: true,
      },
      {
        id: "dashboard",
        icon: "dashboard",
        labelKey: "welcome.dataDashboard",
        action: { kind: "none" },
        comingSoon: true,
      },
      {
        id: "adpool",
        icon: "campaign",
        labelKey: "welcome.adPool",
        action: { kind: "none" },
        comingSoon: true,
      },
      {
        id: "contact",
        icon: "inbox",
        labelKey: "welcome.contactUs",
        action: { kind: "none" },
        comingSoon: true,
      },
    ],
  },
  {
    id: "developer",
    items: [
      {
        id: "developer-group",
        icon: "terminal",
        labelKey: "welcome.developer",
        action: { kind: "none" },
        children: [
          {
            id: "termity",
            icon: "terminal",
            labelKey: "welcome.termity",
            action: { kind: "window", viewType: "termity" },
            small: true,
          },
          {
            id: "versenet",
            icon: "public",
            labelKey: "welcome.verseNET",
            action: { kind: "none" },
            comingSoon: true,
            small: true,
          },
        ],
      },
    ],
  },
];

export const DEFAULT_STATUS_ITEMS: WelcomeStatusItemConfig[] = [
  { id: "online", labelKey: "welcome.online", source: { kind: "onlineCount" } },
  { id: "versenet", labelKey: "Verse NET", source: { kind: "backend" } },
];
