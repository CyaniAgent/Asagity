"use client";

import { useEffect } from "react";
import { useRouterStore } from "@/stores/router";
import { useUserStore } from "@/stores/user";
import { useFreeWindowStore } from "@/stores/freeWindow";

/**
 * /login 路由页面
 *
 * 未登录 → 打开 AuthModal（登录模式）
 * 已登录 → 重定向到首页
 */
export default function LoginPage() {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const router = useRouterStore();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/");
    } else {
      useFreeWindowStore.getState().openFromContext("login_window");
    }
  }, [isLoggedIn, router]);

  return null;
}
