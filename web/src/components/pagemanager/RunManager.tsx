"use client";

import { usePathname } from "@/hooks/usePathname";
import { usePageManagerStore } from "@/stores/pageManager";
import { useSplitViewStore } from "@/stores/splitView";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { getViewConfig } from "@/components/windows/WindowManager";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/**
 * 下部分：标签页与窗口的统一化运行管理器。
 * 三类运行项（能力各不同）：
 * - route：当前路由（切换，不可关闭/最小化）
 * - split：右侧视图（切换 + 关闭）
 * - window：自由窗口（切换 + 最小化/恢复 + 关闭）
 */
export function RunManager() {
  const { t } = useI18n();
  const pathname = usePathname();
  const menu = usePageManagerStore((s) => s.menu);

  const splitOpen = useSplitViewStore((s) => s.isOpen);
  const splitViewType = useSplitViewStore((s) => s.currentRightViewType);
  const splitActive = useSplitViewStore((s) => s.activeView === "right");
  const focusLeft = useSplitViewStore((s) => s.focusLeft);
  const focusRight = useSplitViewStore((s) => s.focusRight);
  const closeSplit = useSplitViewStore((s) => s.close);

  const windows = useFreeWindowStore((s) => s.windows);
  const focusedId = useFreeWindowStore((s) => s.focusedId);
  const focusWindow = useFreeWindowStore((s) => s.focus);
  const closeWindow = useFreeWindowStore((s) => s.close);
  const setMinimized = useFreeWindowStore((s) => s.setMinimized);

  // 当前路由归属到菜单项（取图标与文案），兜底显示路径本身
  const search = typeof window !== "undefined" ? window.location.search : "";
  const routeEntry = menu.find(
    (e): e is Extract<typeof e, { kind: "link" }> =>
      e.kind === "link" &&
      (e.to === "/"
        ? pathname === "/" && (e.query ? search.includes(e.query.replace(/^\?/, "")) : !search.includes("tab="))
        : pathname === e.to || pathname.startsWith(`${e.to}/`)),
  );

  const splitConfig = splitOpen && splitViewType ? getViewConfig(splitViewType) : null;

  const actionBtn =
    "size-7 grid place-items-center shrink-0 rounded-full text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 transition-colors";

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-1">
        {t("pageManager.runManager")}
      </span>

      {/* ── 标签页 ── */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-3">
          {t("pageManager.tabs")}
        </span>
        <button
          onClick={focusLeft}
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-brand/10 text-branddeep dark:text-fgaccent transition-colors group"
        >
          <Icon name={routeEntry?.kind === "link" ? routeEntry.icon : "home"} fontSize={18} className="shrink-0" />
          <span className="flex-1 text-left text-[13px] font-semibold truncate">
            {routeEntry?.kind === "link" ? t(routeEntry.labelKey) : pathname}
          </span>
          <span className="size-1.5 rounded-full bg-brand shrink-0" />
        </button>
      </div>

      {/* ── 窗口 ── */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-3">
          {t("pageManager.windows")}
        </span>

        {splitConfig && (
          <div
            onClick={focusRight}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer group ${
              splitActive
                ? "bg-brand/10 text-branddeep dark:text-fgaccent"
                : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Icon name={splitConfig.icon ?? "tab_move"} fontSize={18} className="shrink-0" />
            <span className="flex-1 text-left text-[13px] font-medium truncate">
              {splitConfig.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); closeSplit(); }}
              className={actionBtn}
              title={t("common.close")}
            >
              <Icon name="close" fontSize={14} />
            </button>
          </div>
        )}

        {windows.map((win) => {
          const config = getViewConfig(win.viewType);
          const focused = focusedId === win.id && !win.isMinimized;
          return (
            <div
              key={win.id}
              onClick={() => focusWindow(win.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer group ${
                focused
                  ? "bg-brand/10 text-branddeep dark:text-fgaccent"
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              } ${win.isMinimized ? "opacity-50" : ""}`}
            >
              <Icon name={config.icon ?? "tab_move"} fontSize={18} className="shrink-0" />
              <span className="flex-1 text-left text-[13px] font-medium truncate">
                {config.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(win.id, !win.isMinimized); }}
                className={actionBtn}
                title={win.isMinimized ? t("common.maximize") : t("common.minimize")}
              >
                <Icon name={win.isMinimized ? "maximize" : "minimize"} fontSize={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                className={actionBtn}
                title={t("common.close")}
              >
                <Icon name="close" fontSize={14} />
              </button>
            </div>
          );
        })}

        {!splitConfig && windows.length === 0 && (
          <span className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500">
            {t("pageManager.empty")}
          </span>
        )}
      </div>
    </div>
  );
}
