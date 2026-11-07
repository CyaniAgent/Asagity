"use client";

import { lazy, Suspense, useEffect } from "react";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeInit } from "@/components/providers/ThemeInit";
import { TermityAuthModal } from "@/components/termity/TermityAuthModal";
import { PortalDebugger } from "@/components/portal-debugger/PortalDebugger";
import { initAuth } from "@/lib/authGuard";
import { initAppVersion } from "@/lib/version";
import { usePathname } from "@/hooks/usePathname";
import { allRoutes } from "@/lib/routes";
import { RouteView } from "@/components/layout/RouteView";

import { AuthModal } from "@/components/auth/AuthModal";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { ToastContainer } from "@/components/toast";
import { useSystemStore } from "@/stores/system";
import { ChunkPulse } from "@/components/ui/ChunkPulse";

const WindowManager = lazy(() => import("@/components/windows/WindowManager").then((m) => ({ default: m.WindowManager })));
const HomePage = lazy(() => import("@/pages/page").then((m) => ({ default: m.default })));
const NotFound = lazy(() => import("@/pages/not-found").then((m) => ({ default: m.default })));
// 开屏（挂在 I18nProvider 内；chunk 到达前由 index.html 的 boot splash 兜底）
const SplashScreen = lazy(() => import("@/components/ui/SplashScreen").then((m) => ({ default: m.SplashScreen })));

/** 顶层路由：根路径渲染 HomePage，其余走 RouteView */
function TopRouter() {
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <Suspense fallback={<ChunkPulse />}>
        <HomePage />
      </Suspense>
    );
  }

  return <RouteView routes={allRoutes} fallback={NotFound} />;
}

export function ClientLayout() {
  const isAuthOpen = useFreeWindowStore((s) => s.isAuthOpen);

  // 初始化启动序列（开屏数据源：分阶段真进度；SplashScreen/Welcome 全入口共用）
  useEffect(() => {
    useSystemStore.getState().initSequence();
  }, []);

  // 初始化路由守卫（替代 Next.js middleware）
  useEffect(() => {
    initAuth();
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
