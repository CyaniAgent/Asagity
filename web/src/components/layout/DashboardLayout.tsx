"use client";

/**
 * DashboardLayout - 登录后的主布局框架
 *
 * 与 Next.js 路由解耦的四区域布局：
 *   ┌─────────────────────────────────────────┐
 *   │          信息与状态栏 / 上侧小组件         │
 *   ├────────┬───────────────────┬─────────────┤
 *   │ 页面   │                   │  右侧       │
 *   │ 管理器 │    标签页显示区域   │  小组件     │
 *   │ /配置  │                   │  显示区域   │
 *   │ 菜单   │                   │             │
 *   └────────┴───────────────────┴─────────────┘
 *
 * 当前仅显示区域占位信息，不包含任何功能。
 */
export function DashboardLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-[#121212] overflow-hidden font-sans">
      {/* ── 顶部区域：信息与状态栏 / 上侧小组件显示区域 ── */}
      <header className="h-14 shrink-0 flex items-center justify-center border-b border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-white/[0.03]">
        <span className="text-sm text-gray-400 dark:text-gray-500 select-none">
          信息与状态栏，上侧小组件显示区域
        </span>
      </header>

      {/* ── 下方三栏区域 ── */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧区域：页面管理器 / 配置菜单 */}
        <aside className="w-64 shrink-0 flex items-center justify-center border-r border-dashed border-gray-300 dark:border-gray-700 bg-white/30 dark:bg-white/[0.02]">
          <span className="text-sm text-gray-400 dark:text-gray-500 select-none leading-relaxed text-center">
            页面管理器
            <br />
            / 配置菜单
          </span>
        </aside>

        {/* 中央区域：标签页显示区域 */}
        <main className="flex-1 flex items-center justify-center min-w-0 bg-gray-100 dark:bg-[#121212]">
          <span className="text-sm text-gray-400 dark:text-gray-500 select-none">
            标签页显示区域
          </span>
        </main>

        {/* 右侧区域：右侧小组件显示区域 */}
        <aside className="w-72 shrink-0 flex items-center justify-center border-l border-dashed border-gray-300 dark:border-gray-700 bg-white/30 dark:bg-white/[0.02]">
          <span className="text-sm text-gray-400 dark:text-gray-500 select-none">
            右侧小组件显示区域
          </span>
        </aside>
      </div>
    </div>
  );
}
