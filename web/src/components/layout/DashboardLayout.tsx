import { useEffect, useRef, useState, type ReactNode } from "react";
import { TopBar } from "@/components/topbar/TopBar";
import { WidgetsArea } from "@/components/widgets/WidgetsArea";
import { PageManager } from "@/components/pagemanager/PageManager";
import { TaskManager } from "@/components/taskmanager/TaskManager";
import { PageStrip } from "@/components/pagestrip/PageStrip";
import { usePageStripStore } from "@/stores/pageStrip";

/**
 * DashboardLayout - 登录后的主布局框架
 *
 * 新外壳：TopBar + 全宽工作区 + 底部任务管理器（居中 Dock）。
 * 旧左侧 PageManager 与右侧 WidgetsArea 仅禁用，代码保留以便未来恢复：
 * - WIDGETS_ENABLED=true 恢复小组件区
 * - LEGACY_PAGE_MANAGER_ENABLED=true 恢复旧侧栏（与 Dock 同时开会出现重复导航）
 *
 * 页面条带（P1）尚未接入；当前 active 页面点击任务时，先用 main 边框高亮 3s 占位，
 * 未来改为 pageStrip.flashPanel(tileId)。
 */
const WIDGETS_ENABLED = false;
const LEGACY_PAGE_MANAGER_ENABLED = false;

export interface DashboardLayoutProps {
  children?: ReactNode;
  /** 外部路由进入新外壳时，作为首个/活跃 Tab 打开 */
  routeTab?: {
    icon: string;
    title?: string;
    titleKey?: string;
    view: { kind: "route" | "split" | "window"; refId: string };
  };
}

export function DashboardLayout({ children, routeTab }: DashboardLayoutProps) {
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);

  // 外部路由 → 条带 Tab：在 effect 中写入 store，避免 render 期 setState 警告
  useEffect(() => {
    if (!routeTab) return;
    usePageStripStore.getState().openTab({
      appId: routeTab.view.refId,
      icon: routeTab.icon,
      title: routeTab.title,
      titleKey: routeTab.titleKey,
      view: routeTab.view,
    });
  }, [routeTab?.view.refId, routeTab?.icon, routeTab?.title, routeTab?.titleKey]);

  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const handleFlash = (target: string) => {
    usePageStripStore.getState().flashTab(target);
    setFlash(target);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 3000);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-[#121212] overflow-hidden font-sans">
      {/* ── 顶部：信息与状态栏（保留） ── */}
      <TopBar />

      {/* ── 中部：全宽工作区 ── */}
      <div className="flex-1 flex min-h-0">
        {LEGACY_PAGE_MANAGER_ENABLED && (
          <aside className="w-64 shrink-0 min-h-0 bg-white/30 dark:bg-white/[0.02]">
            <PageManager />
          </aside>
        )}

        <main
          data-flash-target={flash ?? undefined}
          className={`flex-1 flex flex-col min-w-0 min-h-0 bg-gray-100 dark:bg-[#121212] ${
            flash ? "ring-2 ring-inset ring-brand" : ""
          }`}
        >
          {/* P1 页面条带接管中部工作区；children 仅作兼容保留 */}
          <PageStrip />
          {children}
        </main>

        {WIDGETS_ENABLED && (
          <aside className="w-72 shrink-0 min-h-0 bg-white/30 dark:bg-white/[0.02]">
            <WidgetsArea />
          </aside>
        )}
      </div>

      {/* ── 底部：任务管理器（Dock） ── */}
      <TaskManager onFlash={handleFlash} />
    </div>
  );
}
