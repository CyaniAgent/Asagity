import type { ViewType } from "@/types/windows";
import { DEFAULT_PAGE_MENU } from "@/components/pagemanager/pageManagerConfig";
import { DEFAULT_MENU_GROUPS } from "@/components/welcome/welcomeConfig";
import type { Locale } from "@/stores/locale";

/** 任务管理器统一应用目录项。 */
export type AppLaunch =
  | { kind: "route"; to: string }
  | { kind: "window"; viewType: ViewType }
  | { kind: "disabled" };

export interface AppEntry {
  id: string;
  icon: string;
  labelKey: string;
  launch: AppLaunch;
  group: "shortcut" | "app" | "more";
}

/** 左侧三个固定快捷方式（首页先做占位，时间线/消息走路由）。 */
export const SHORTCUTS: AppEntry[] = [
  { id: "shortcut-home", icon: "home", labelKey: "taskbar.home", launch: { kind: "route", to: "/" }, group: "shortcut" },
  { id: "shortcut-timeline", icon: "dynamic_feed", labelKey: "sidebar.timeline", launch: { kind: "route", to: "/?tab=followed" }, group: "shortcut" },
  { id: "shortcut-messages", icon: "chat", labelKey: "taskbar.messages", launch: { kind: "route", to: "/chat" }, group: "shortcut" },
];

/**
 * 合并「页面管理菜单」与「欢迎页更多菜单」，按 id 去重。
 * 欢迎页里 comingSoon / kind:none 的项保留为 disabled，未来接上真实页面即可启用。
 */
export function buildAppCatalog(label?: (key: string) => string): AppEntry[] {
  const entries: AppEntry[] = [...SHORTCUTS];

  for (const item of DEFAULT_PAGE_MENU) {
    if (item.kind !== "link") continue;
    entries.push({
      id: `menu-${item.id}`,
      icon: item.icon,
      labelKey: item.id === "orgs" ? "taskbar.spaces" : item.labelKey,
      launch: { kind: "route", to: item.query ? `${item.to}${item.query}` : item.to },
      group: "app",
    });
  }

  for (const group of DEFAULT_MENU_GROUPS) {
    for (const item of group.items) {
      const children = item.children ?? [item];
      for (const child of children) {
        const launch: AppLaunch =
          child.action.kind === "window"
            ? { kind: "window", viewType: child.action.viewType }
            : { kind: "disabled" };
        entries.push({
          id: `more-${child.id}`,
          icon: child.icon,
          labelKey: child.labelKey,
          launch,
          group: "more",
        });
      }
    }
  }

  const seen = new Set<string>();
  return entries.filter((entry) => {
    // 按实际启动目标去重：同一路由/窗口即使 i18n key 不同也只保留一条
    const key = label
      ? `name:${label(entry.labelKey)}`
      : entry.launch.kind === "route"
        ? `route:${entry.launch.to}`
        : entry.launch.kind === "window"
          ? `window:${entry.launch.viewType}`
          : `disabled:${entry.labelKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 按当前语言的显示名做 A-Z 排序（中文拼音序、英文词序）。 */
export function sortApps(
  entries: AppEntry[],
  label: (key: string) => string,
  locale: Locale,
): AppEntry[] {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  return [...entries].sort((a, b) => collator.compare(label(a.labelKey), label(b.labelKey)));
}
