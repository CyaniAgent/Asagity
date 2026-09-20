"use client";

import { useMemo } from "react";
import { usePathname } from "./usePathname";
import { extractParams } from "@/lib/router";

/**
 * 动态路由参数 Hook
 *
 * 从当前路径中提取匹配模式的动态参数。
 *
 * @param pattern 路由模式，如 `/user/:id`
 * @returns 参数对象，如 `{ id: "42" }`
 *
 * @example
 * // URL: /user/123
 * const params = useParams("/user/:id");
 * // params = { id: "123" }
 */
export function useParams(pattern: string): Record<string, string> {
  const pathname = usePathname();
  return useMemo(() => extractParams(pattern, pathname), [pattern, pathname]);
}
