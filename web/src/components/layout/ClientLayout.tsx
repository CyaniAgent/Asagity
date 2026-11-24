"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeInit } from "@/components/providers/ThemeInit";
import { TermityAuthModal } from "@/components/termity/TermityAuthModal";
import { PortalDebugger } from "@/components/portal-debugger/PortalDebugger";
import { initAuth } from "@/lib/authGuard";
import { initAppVersion } from "@/lib/version";
import { usePathname } from "@/hooks/usePathname";
import { useUserStore } from "@/stores/user";
import { useRouterStore } from "@/stores/router";
import { useI18n } from "@/components/providers/I18nProvider";
import { DEFAULT_PAGE_MENU } from "@/components/pagemanager/pageManagerConfig";
import { allRoutes } from "@/lib/routes";
import { RouteView } from "@/components/layout/RouteView";

import { AuthModal } from "@/components/auth/AuthModal";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { ToastContainer } from "@/components/toast";
import { useSystemStore } from "@/stores/system";
import { ChunkPulse } from "@/components/ui/ChunkPulse";

const WindowManager = lazy(() => import("@/components/windows/WindowManager").then((m) => ({ default: m.WindowManager })));
const DashboardLayout = lazy(() => import("@/components/layout/DashboardLayout").then((m) => ({ default: m.DashboardLayout })));
const HomePage = lazy(() => import("@/pages/page").then((m) => ({ default: m.default })));
const NotFound = lazy(() => import("@/pages/not-found").then((m) => ({ default: m.default })));
// 开屏（挂在 I18nProvider 内；chunk 到达前由 index.html 的 boot splash 兜底）
const SplashScreen = lazy(() => import("@/components/ui/SplashScreen").then((m) => ({ default: m.SplashScreen })));

/** 顶层路由：根路径渲染 HomePage；登录态其他路由统一进新外壳，其余走旧 RouteView（公开页） */
function iconForRoute(pathname: string): string {
  if (pathname.startsWith("/topic")) return "tag";
  if (pathname.startsWith("/drive")) return "cloud";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/about")) return "info";
  if (pathname.startsWith("/panel")) return "dashboard";
  return "tab_move";
}

function TopRouter() {
  const pathname = usePathname();
  const search = useRouterStore((s) => s.currentSearch);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const { t } = useI18n();
  const routeTitle = (() => {
    const entry = DEFAULT_PAGE_MENU.find((e) => e.kind === "link" && e.to === pathname);
    if (entry?.kind === "link") return t(entry.labelKey);
    if (pathname.startsWith("/settings")) return t("sidebar.settings");
    if (pathname.startsWith("/panel")) return t("sidebar.panel");
    return pathname;
  })();

  if (pathname === "/") {
    return (
      <Suspense fallback={<ChunkPulse />}>
        <HomePage />
      </Suspense>
    );
  }

  if (isLoggedIn) {
    return (
      <Suspense fallback={<ChunkPulse />}>
        <DashboardLayout
          routeTab={{
            icon: iconForRoute(pathname),
            title: routeTitle,
            view: { kind: "route", refId: `${pathname}${search}` },
          }}
        />
      </Suspense>
    );
  }

  return <RouteView routes={allRoutes} fallback={NotFound} />;
}

export function ClientLayout() {
  const isAuthOpen = useFreeWindowStore((s) => s.isAuthOpen);
  const [authReady, setAuthReady] = useState(false);

  // 初始化启动序列（开屏数据源：分阶段真进度；SplashScreen/Welcome 全入口共用）
  useEffect(() => {
    useSystemStore.getState().initSequence();
  }, []);

  // 先完成用户态 rehydrate，再跑路由守卫并渲染路由：
  // 否则直接访问 "/" 时首帧 isLoggedIn=false，HomePage 会误渲染欢迎页（看起来像掉登录）。
  useEffect(() => {
    void Promise.resolve(useUserStore.persist.rehydrate()).then(() => {
      initAuth();
      setAuthReady(true);
    });
  }, []);

  // package.json 版本语义化写入（构建期静态读取，零网络——versioning.md §4.1）
  useEffect(() => {
    initAppVersion();
  }, []);

  return (
    <>
      <ThemeInit />
      <I18nProvider>
        <Suspense fallback={null}>
          <SplashScreen />
        </Suspense>
        {authReady ? <TopRouter /> : <ChunkPulse />}
        <WindowManager />
        {isAuthOpen && <AuthModal />}
        <ToastContainer />
        <TermityAuthModal />
        <PortalDebugger />
      </I18nProvider>
    </>
  );
}
