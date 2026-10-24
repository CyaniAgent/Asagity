"use client";

import { QuickMenu } from "./QuickMenu";
import { RunManager } from "./RunManager";

/**
 * 左侧页面管理器：上菜单直达 + 下运行管理器。
 * 运行区顶部 hairline 与菜单区分隔，自身限高独立滚动。
 */
export function PageManager() {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* 上：菜单直达 */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-2">
        <QuickMenu />
      </div>

      {/* 下：运行管理器 */}
      <div className="shrink-0 border-t border-gray-200/60 dark:border-white/10 px-3 py-3 max-h-[45%] overflow-y-auto custom-scrollbar">
        <RunManager />
      </div>
    </div>
  );
}
