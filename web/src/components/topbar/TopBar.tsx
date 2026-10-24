"use client";

import { BrandBlock } from "./BrandBlock";
import { ConnectionPill } from "./ConnectionPill";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { UserAvatar } from "./UserAvatar";

/**
 * 信息与状态栏（新主界面顶栏 · 雏形）。
 *
 * 三段式：左品牌 / 中预留（空）/ 右组件群。
 * 右侧为槽位化组件：当前硬编码装配，后续接 topbar config
 * 即可任意增删（音乐迷你 / 小组件开关 / 搜索等）。
 * 与内容区一体融合，无分割线。
 */
export function TopBar() {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between pl-4 pr-3 z-10">
      {/* 左：站点 logo + 站点名称 */}
      <BrandBlock />

      {/* 中：预留（空） */}
      <div className="flex-1 min-w-0" />

      {/* 右：顶栏组件 + 通知中心 + 用户头像 */}
      <div className="flex items-center gap-2 shrink-0">
        <ConnectionPill />
        <ThemeToggle />
        <NotificationCenter />
        <UserAvatar />
      </div>
    </header>
  );
}
