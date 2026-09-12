/**
 * 路由配置表
 *
 * 定义所有客户端路由及其对应的页面组件。
 * 替代 Next.js App Router 的文件路由。
 *
 * - wrapInMainLayout: true (默认) → 组件包裹在 <MainLayout> 中
 * - wrapInMainLayout: false → 组件自行处理布局（如 SettingsLayout）
 */
import { lazy } from "react";
import { useRouterStore } from "@/stores/router";
import type { RouteEntry } from "@/components/layout/RouteView";

/* ------------------------------------------------------------------ */
/*  重定向路由                                                          */
/* ------------------------------------------------------------------ */

const Redirect = ({ to }: { to: string }) => {
  useRouterStore.getState().replace(to);
  return null;
};

export const redirectRoutes: RouteEntry[] = [
  { path: "/settings", component: lazy(() => Promise.resolve({ default: () => <Redirect to="/settings/profile" /> })) },
  { path: "/panel/manage", component: lazy(() => Promise.resolve({ default: () => <Redirect to="/panel/users" /> })) },
];

/* ------------------------------------------------------------------ */
/*  简单页面 — 使用默认 MainLayout 包裹                                  */
/* ------------------------------------------------------------------ */

export const aboutRoutes: RouteEntry[] = [
  { path: "/about", component: lazy(() => import("@/pages/about/page").then((m) => ({ default: m.default }))) },
  { path: "/about/emojis", component: lazy(() => import("@/pages/about/emojis/page").then((m) => ({ default: m.default }))) },
  { path: "/about/charts", component: lazy(() => import("@/pages/about/charts/page").then((m) => ({ default: m.default }))) },
  { path: "/about/federation", component: lazy(() => import("@/pages/about/federation/page").then((m) => ({ default: m.default }))) },
];

export const socialRoutes: RouteEntry[] = [
  { path: "/achievements", component: lazy(() => import("@/pages/achievements/page").then((m) => ({ default: m.default }))) },
  { path: "/albums", component: lazy(() => import("@/pages/albums/page").then((m) => ({ default: m.default }))) },
  { path: "/bookmarks", component: lazy(() => import("@/pages/bookmarks/page").then((m) => ({ default: m.default }))) },
  { path: "/games", component: lazy(() => import("@/pages/games/page").then((m) => ({ default: m.default }))) },
  { path: "/miniapp", component: lazy(() => import("@/pages/miniapp/page").then((m) => ({ default: m.default }))) },
  { path: "/qrcode", component: lazy(() => import("@/pages/qrcode/page").then((m) => ({ default: m.default }))) },
  { path: "/topic", component: lazy(() => import("@/pages/topic/page").then((m) => ({ default: m.default }))) },
  { path: "/topic/create", component: lazy(() => import("@/pages/topic/create/page").then((m) => ({ default: m.default }))) },
  { path: "/announcement", component: lazy(() => import("@/pages/announcement/page").then((m) => ({ default: m.default }))) },
];

export const chatRoutes: RouteEntry[] = [
  { path: "/chat", component: lazy(() => import("@/pages/chat/page").then((m) => ({ default: m.default }))) },
  { path: "/chat/contacts", component: lazy(() => import("@/pages/chat/contacts/page").then((m) => ({ default: m.default }))) },
  { path: "/chat/meet", component: lazy(() => import("@/pages/chat/meet/page").then((m) => ({ default: m.default }))) },
  { path: "/chat/:id", component: lazy(() => import("@/pages/chat/[id]/page").then((m) => ({ default: m.default }))) },
];

export const driveRoutes: RouteEntry[] = [
  { path: "/drive", component: lazy(() => import("@/pages/drive/page").then((m) => ({ default: m.default }))) },
  { path: "/drive/shared", component: lazy(() => import("@/pages/drive/shared/page").then((m) => ({ default: m.default }))) },
  { path: "/drive/drop", component: lazy(() => import("@/pages/drive/drop/page").then((m) => ({ default: m.default }))) },
];

export const miscRoutes: RouteEntry[] = [
  { path: "/developer", component: lazy(() => import("@/pages/developer/page").then((m) => ({ default: m.default }))) },
  { path: "/user/:id", component: lazy(() => import("@/pages/user/[id]/page").then((m) => ({ default: m.default })), ) },
  { path: "/post/:id", component: lazy(() => import("@/pages/post/[id]/page").then((m) => ({ default: m.default }))) },
];

/* ------------------------------------------------------------------ */
/*  设置页面 — 使用 SettingsLayout 包裹（自带侧边栏 + MainLayout）       */
/* ------------------------------------------------------------------ */

import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { PanelSettingsLayout } from "@/components/layout/PanelSettingsLayout";

const settingsPage = (importFn: () => Promise<{ default: React.ComponentType }>) =>
  lazy(() =>
    importFn().then((m) => ({
      default: () => <SettingsLayout><m.default /></SettingsLayout>,
    }))
  );

const panelSettingsPage = (importFn: () => Promise<{ default: React.ComponentType }>) =>
  lazy(() =>
    importFn().then((m) => ({
      default: () => <PanelSettingsLayout><m.default /></PanelSettingsLayout>,
    }))
  );

export const settingsRoutes: RouteEntry[] = [
  { path: "/settings/profile", component: settingsPage(() => import("@/pages/settings/profile/page")), wrapInMainLayout: false },
  { path: "/settings/privacy", component: settingsPage(() => import("@/pages/settings/privacy/page")), wrapInMainLayout: false },
  { path: "/settings/notifications", component: settingsPage(() => import("@/pages/settings/notifications/page")), wrapInMainLayout: false },
  { path: "/settings/personalization", component: settingsPage(() => import("@/pages/settings/personalization/page")), wrapInMainLayout: false },
  { path: "/settings/sound", component: settingsPage(() => import("@/pages/settings/sound/page")), wrapInMainLayout: false },
  { path: "/settings/drive", component: settingsPage(() => import("@/pages/settings/drive/page")), wrapInMainLayout: false },
  { path: "/settings/plugins", component: settingsPage(() => import("@/pages/settings/plugins/page")), wrapInMainLayout: false },
];

/* ------------------------------------------------------------------ */
/*  管理面板页面 — 使用默认 MainLayout                                   */
/* ------------------------------------------------------------------ */

export const panelRoutes: RouteEntry[] = [
  { path: "/panel", component: lazy(() => import("@/pages/panel/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/users", component: lazy(() => import("@/pages/panel/users/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/users/:id", component: lazy(() => import("@/pages/panel/users/[id]/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/federation", component: lazy(() => import("@/pages/panel/federation/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/emojis", component: lazy(() => import("@/pages/panel/emojis/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/announcements", component: lazy(() => import("@/pages/panel/announcements/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/abuses", component: lazy(() => import("@/pages/panel/abuses/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/modlog", component: lazy(() => import("@/pages/panel/modlog/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/net", component: lazy(() => import("@/pages/panel/net/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/invites", component: lazy(() => import("@/pages/panel/invites/page").then((m) => ({ default: m.default }))) },
  { path: "/panel/settings/instance", component: panelSettingsPage(() => import("@/pages/panel/settings/instance/page")), wrapInMainLayout: false },
  { path: "/panel/settings/moderation", component: panelSettingsPage(() => import("@/pages/panel/settings/moderation/page")), wrapInMainLayout: false },
  { path: "/panel/settings/email", component: panelSettingsPage(() => import("@/pages/panel/settings/email/page")), wrapInMainLayout: false },
  { path: "/panel/settings/storage", component: panelSettingsPage(() => import("@/pages/panel/settings/storage/page")), wrapInMainLayout: false },
  { path: "/panel/settings/security", component: panelSettingsPage(() => import("@/pages/panel/settings/security/page")), wrapInMainLayout: false },
];

/* ------------------------------------------------------------------ */
/*  聚合所有路由                                                        */
/* ------------------------------------------------------------------ */

export const allRoutes: RouteEntry[] = [
  ...redirectRoutes,
  ...aboutRoutes,
  ...socialRoutes,
  ...chatRoutes,
  ...driveRoutes,
  ...miscRoutes,
  ...settingsRoutes,
  ...panelRoutes,
];
