"use client";

import { useRouterStore } from "@/stores/router";

/**
 * 当前路径 Hook — 替代 next/navigation 的 usePathname
 *
 * 返回当前 URL 路径（不含 query string）。
 * 路径变化时自动触发重新渲染。
 *
 * @example
 * const pathname = usePathname();
 * const isActive = pathname === "/";
 */
export function usePathname(): string {
  return useRouterStore((s) => s.currentPath);
}
