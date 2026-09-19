"use client";

import { lazy, Suspense, useEffect } from "react";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeInit } from "@/components/providers/ThemeInit";
import { TermityAuthModal } from "@/components/termity/TermityAuthModal";
import { PortalDebugger } from "@/components/portal-debugger/PortalDebugger";
import { initAuth } from "@/lib/authGuard";
import { fetchAppVersion } from "@/lib/version";
import { usePathname } from "@/hooks/usePathname";
import { allRoutes } from "@/lib/routes";
import { RouteView } from "@/components/layout/RouteView";

import { AuthModal } from "@/components/auth/AuthModal";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { ToastContainer } from "@/components/toast";

const WindowManager = lazy(() => import("@/components/windows/WindowManager").then((m) => ({ default: m.WindowManager })));
const HomePage = lazy(() => import("@/pages/page").then((m) => ({ default: m.default })));
const NotFound = lazy(() => import("@/pages/not-found").then((m) => ({ default: m.default })));

/** 顶层路由：根路径渲染 HomePage，其余走 RouteView */
function TopRouter() {
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <Suspense fallback={null}>
        <HomePage />
      </Suspense>
    );
  }

  return <RouteView routes={allRoutes} fallback={NotFound} />;
}

export function ClientLayout() {
  const isAuthOpen = useFreeWindowStore((s) => s.isAuthOpen);

  // 初始化路由守卫（替代 Next.js middleware）
  useEffect(() => {
    initAuth();
  }, []);

  // 从后端获取当前版本号
  useEffect(() => {
    fetchAppVersion();
  }, []);

  return (
    <>
      <ThemeInit />
      <I18nProvider>
        <TopRouter />
        <WindowManager />
        {isAuthOpen && <AuthModal />}
        <ToastContainer />
        <TermityAuthModal />
        <PortalDebugger />
      </I18nProvider>
    </>
  );
}
