/**
 * 路由匹配工具函数
 *
 * 支持：
 *   /about              — 静态路由
 *   /user/:id           — 单段动态参数
 *   /panel/users/:id    — 多段混合路由
 *   /chat/*             — 通配符（以此前缀匹配即命中）
 *
 * 用法：
 *   matchRoute("/user/:id", "/user/123")
 *   // → { matched: true, params: { id: "123" } }
 */

/** 路由匹配结果 */
export interface RouteMatch {
  matched: boolean;
  params: Record<string, string>;
}

/**
 * 匹配路由模式与实际路径
 *
 * @param pattern  路由模式，如 `/user/:id`
 * @param pathname 实际路径，如 `/user/42`
 * @returns 匹配结果（含提取的动态参数）
 */
export function matchRoute(pattern: string, pathname: string): RouteMatch {
  const patternParts = pattern.replace(/^\/+|\/+$/g, "").split("/");
  const pathParts = pathname.replace(/^\/+|\/+$/g, "").split("/");

  // 通配符：模式以 * 结尾，路径前缀匹配即可
  if (patternParts[patternParts.length - 1] === "*") {
    const prefix = patternParts.slice(0, -1);
    if (prefix.length === 0) return { matched: true, params: {} };
    if (pathParts.length < prefix.length) return { matched: false, params: {} };
    for (let i = 0; i < prefix.length; i++) {
      if (prefix[i].startsWith(":")) continue;
      if (prefix[i] !== pathParts[i]) return { matched: false, params: {} };
    }
    return { matched: true, params: {} };
  }

  // 段数不同 → 不匹配
  if (patternParts.length !== pathParts.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      // 动态段：提取参数值
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      // 静态段：必须完全相同
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

/**
 * 从路径中提取动态参数
 *
 * @param pattern  路由模式，如 `/user/:id`
 * @param pathname 当前路径
 * @returns 提取的参数对象，如 `{ id: "42" }`
 */
export function extractParams(pattern: string, pathname: string): Record<string, string> {
  return matchRoute(pattern, pathname).params;
}
