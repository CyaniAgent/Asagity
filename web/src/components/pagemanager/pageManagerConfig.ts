"use client";

/** 页面管理器菜单项：链接 / 分隔符 / 更多（弹窗） */
export type PageMenuEntry =
  | {
      kind: "link";
      id: string;
      icon: string;
      labelKey: string;
      to: string;
      /** 附加 query（如时间线 ?tab=followed），命中该 query 才算 active */
      query?: string;
    }
  | { kind: "separator"; id: string }
  | { kind: "more"; id: string; icon: string; labelKey: string };

/**
 * 上部分菜单直达（全新重写，不沿用旧 Sidebar 分组）。
 * 文案全部复用 sidebar.* / tabs.* 现有 key，零新增。
 */
export const DEFAULT_PAGE_MENU: PageMenuEntry[] = [
  { kind: "link", id: "home", icon: "home", labelKey: "tabs.home", to: "/" },
  { kind: "link", id: "timeline", icon: "dynamic_feed", labelKey: "sidebar.timeline", to: "/", query: "?tab=followed" },
  { kind: "link", id: "topic", icon: "tag", labelKey: "sidebar.topics", to: "/topic" },
  { kind: "link", id: "drive", icon: "cloud", labelKey: "sidebar.skylineDrive", to: "/drive" },
  { kind: "separator", id: "sep-1" },
  { kind: "link", id: "chat", icon: "chat", labelKey: "sidebar.chat", to: "/chat" },
  { kind: "link", id: "orgs", icon: "group", labelKey: "sidebar.clubs", to: "/orgs" },
  { kind: "link", id: "announcement", icon: "campaign", labelKey: "sidebar.announcements", to: "/announcement" },
  { kind: "separator", id: "sep-2" },
  { kind: "link", id: "settings", icon: "settings", labelKey: "sidebar.settings", to: "/settings" },
  { kind: "more", id: "more", icon: "more_horiz", labelKey: "sidebar.more" },
];

/** 路由 active 判定（含根路径 ?tab= 排除，保证首页/时间线互斥高亮） */
export function isMenuActive(
  entry: Extract<PageMenuEntry, { kind: "link" }>,
  pathname: string,
  search: string,
): boolean {
  const pathHit =
    entry.to === "/"
      ? pathname === "/"
      : pathname === entry.to || pathname.startsWith(`${entry.to}/`);
  if (!pathHit) return false;
  // 根路径两项互斥：首页要求无 tab 参数，时间线要求命中自家 query
  if (entry.to === "/" && !entry.query) return !search.includes("tab=");
  if (entry.query) return search.includes(entry.query.replace(/^\?/, ""));
  return true;
}
