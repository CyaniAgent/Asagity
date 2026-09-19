"use client";

import { lazy, Suspense, useMemo } from "react";
import { usePathname } from "@/hooks/usePathname";
import { matchRoute } from "@/lib/router";
import type { ComponentType } from "react";

/**
 * 路由配置项
 *
 * - path: 路由模式（支持 /:param 动态段）
 * - component: 懒加载的页面组件
 * - wrapInMainLayout: 是否用 MainLayout 包裹（默认 true）
 */
export interface RouteEntry {
  path: string;
  component: React.LazyExoticComponent<ComponentType>;
  wrapInMainLayout?: boolean;
}

/** 路由懒加载回退 */
function RouteFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/** MainLayout 懒加载 */
const MainLayout = lazy(() =>
  import("@/components/layout/MainLayout").then((m) => ({ default: m.MainLayout }))
);

/**
 * 路由视图组件
 *
 * 根据当前路径匹配路由配置，渲染对应的页面组件。
 * 未匹配时渲染 fallback。
 *
 * @param routes  路由配置表
 * @param fallback 未匹配时的回退组件
 */
export function RouteView({
  routes,
  fallback: Fallback,
}: {
  routes: RouteEntry[];
  fallback?: ComponentType;
}) {
  const pathname = usePathname();

  const matched = useMemo(() => {
    for (const route of routes) {
      const result = matchRoute(route.path, pathname);
      if (result.matched) {
        return { route, params: result.params };
      }
    }
    return null;
  }, [routes, pathname]);

  if (!matched) {
    const FallbackComponent = Fallback;
    return FallbackComponent ? <FallbackComponent /> : <RouteFallback />;
  }

  const { route } = matched;
  const PageComponent = route.component;
  const shouldWrap = route.wrapInMainLayout !== false;

  const content = (
    <Suspense fallback={<RouteFallback />}>
      <PageComponent />
    </Suspense>
  );

  if (shouldWrap) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <MainLayout>{content}</MainLayout>
      </Suspense>
    );
  }

  return content;
}
