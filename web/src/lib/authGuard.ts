/**
 * 客户端路由守卫
 *
 * 替代 Next.js middleware.ts 的认证检查逻辑。
 * 在应用启动时调用 initAuth()，后续由 RouterStore 的 push/replace 触发守卫。
 *
 * 逻辑：
 * - 公开页面：/  /login  /register  /about
 * - 已登录用户访问 login/register → 重定向到 /
 * - 未登录用户访问受保护页面 → 重定向到 /
 * - 开发模式绕过：asgt_dev_mode_forever cookie = "true"
 */
import { useRouterStore } from "@/stores/router";

/** 公开页面路径 */
const PUBLIC_PAGES = ["/", "/login", "/register", "/about"];

/** 需要重定向到首页的登录后页面（login/register） */
const REDIRECT_WHEN_LOGGED_IN = ["/login", "/register"];

/**
 * 读取 cookie 值
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 检查当前用户是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getCookie("asagity_access_token");
}

/**
 * 检查是否为开发模式
 */
function isDevMode(): boolean {
  return getCookie("asgt_dev_mode_forever") === "true";
}

/**
 * 检查路径是否为公开页面
 */
function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.includes(pathname);
}

/**
 * 执行路由守卫检查
 *
 * @returns true 表示允许访问，false 表示已重定向
 */
export function guard(): boolean {
  const { currentPath, replace } = useRouterStore.getState();

  // 开发模式绕过
  if (isDevMode()) return true;

  const loggedIn = isLoggedIn();

  // 未登录 → 只能访问公开页面
  if (!loggedIn && !isPublicPage(currentPath)) {
    replace("/");
    return false;
  }

  // 已登录 → 不能访问 login/register
  if (loggedIn && REDIRECT_WHEN_LOGGED_IN.includes(currentPath)) {
    replace("/");
    return false;
  }

  return true;
}

/**
 * 初始化认证守卫
 *
 * 在应用启动时调用一次。监听路由变化并执行守卫。
 */
export function initAuth(): void {
  // 首次执行守卫
  guard();

  // 监听路由变化（popstate）
  window.addEventListener("popstate", () => {
    // 延迟执行，确保 store 已更新
    setTimeout(guard, 0);
  });
}
