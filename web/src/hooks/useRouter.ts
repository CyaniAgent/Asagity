"use client";

import { useRouterStore } from "@/stores/router";

/**
 * 客户端路由 Hook — 替代 next/navigation 的 useRouter
 *
 * 提供 push / replace / back / forward 导航方法，
 * 以及 currentPath / currentSearch 当前路径信息。
 *
 * @example
 * const { push, back, currentPath } = useRouter();
 * push("/user/123");
 * back();
 */
export function useRouter() {
  return useRouterStore();
}
