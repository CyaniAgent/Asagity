"use client";

import { useCallback, type MouseEvent, type ReactNode } from "react";
import { useRouterStore } from "@/stores/router";

interface ClientLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** 点击后额外执行的回调 */
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * 自研 Link 组件 — 替代 next/link
 *
 * 使用 History API 实现客户端导航，不触发页面刷新。
 *
 * @example
 * <ClientLink href="/user/123" className="text-cyan-500">
 *   用户主页
 * </ClientLink>
 */
export function ClientLink({ href, children, className, onClick }: ClientLinkProps) {
  const push = useRouterStore((s) => s.push);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // 保持 Ctrl/Command+Click 在新标签页打开的默认行为
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      onClick?.(e);
      push(href);
    },
    [push, href, onClick],
  );

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
