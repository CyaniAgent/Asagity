"use client";

import { useMemo, useState } from "react";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Popover } from "@astryxdesign/core/Popover";
import { useI18n } from "@/components/providers/I18nProvider";
import { usePathname } from "@/hooks/usePathname";
import { Icon } from "@/components/ui/Icon";
import { getViewConfig } from "@/components/windows/WindowManager";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useSplitViewStore } from "@/stores/splitView";
import { usePageStripStore } from "@/stores/pageStrip";
import { isMenuActive } from "@/components/pagemanager/pageManagerConfig";
import { buildAppCatalog, SHORTCUTS, sortApps, type AppEntry } from "./taskManagerConfig";

interface TaskManagerProps {
  /** 点活跃页面任务时触发的 3s 边缘高亮（由外壳消费；未来由页面条带接管） */
  onFlash: (target: string) => void;
}

/**
 * 任务管理器：居中 Dock = 三快捷方式 + 分隔符 + A-Z 程序列表 + 运行项。
 * 运行项语义：active 页面 → 高亮 3s；active 窗口 → 最小化；非 active/最小化窗口 → 聚焦恢复。
 */
export function TaskManager({ onFlash }: TaskManagerProps) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const search = typeof window !== "undefined" ? window.location.search : "";

  const catalog = useMemo(() => buildAppCatalog(t), [t]);
  const apps = useMemo(() => sortApps(catalog, t, locale), [catalog, t, locale]);
  const [appsOpen, setAppsOpen] = useState(false);

  const windows = useFreeWindowStore((s) => s.windows);
  const focusedId = useFreeWindowStore((s) => s.focusedId);
  const focusWindow = useFreeWindowStore((s) => s.focus);
  const setMinimized = useFreeWindowStore((s) => s.setMinimized);
  const openFromContext = useFreeWindowStore((s) => s.openFromContext);

  const splitOpen = useSplitViewStore((s) => s.isOpen);
  const activeTabId = usePageStripStore((s) => s.activeTabId);
  const splitViewType = useSplitViewStore((s) => s.currentRightViewType);
  const splitActive = useSplitViewStore((s) => s.activeView === "right");
  const focusRight = useSplitViewStore((s) => s.focusRight);

  const launch = (entry: AppEntry) => {
    setAppsOpen(false);
    if (entry.launch.kind === "route") {
      usePageStripStore.getState().openTab({
        appId: entry.id,
        icon: entry.icon,
        titleKey: entry.labelKey,
        view: { kind: "route", refId: entry.launch.to },
      });
    } else if (entry.launch.kind === "window") {
      openFromContext(entry.launch.viewType);
    }
  };

  const shortcutActive = (entry: AppEntry) => {
    if (entry.id === "shortcut-messages") return pathname === "/chat" || pathname.startsWith("/chat/");
    const menuEntry = { kind: "link" as const, id: entry.id, icon: entry.icon, labelKey: entry.labelKey, to: entry.launch.kind === "route" ? entry.launch.to : "/", query: entry.id === "shortcut-timeline" ? "?tab=followed" : undefined };
    return isMenuActive(menuEntry, pathname, search);
  };

  const routeActive = !search.includes("tab=") || pathname !== "/";
  const splitConfig = splitOpen && splitViewType ? getViewConfig(splitViewType) : null;

  const dockBtn =
    "size-10 grid place-items-center shrink-0 rounded-full text-fgdim hover:text-fg hover:bg-fg/5 transition-colors";

  return (
    <footer
      data-testid="task-manager"
      className="shrink-0 flex justify-center items-end pb-3 px-4"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-sheet/80 px-3 py-2 shadow-2xl backdrop-blur-glassheavy">
        {/* ── 左：三快捷方式（图标 only） ── */}
        {SHORTCUTS.map((entry) => {
          const active = shortcutActive(entry);
          return (
            <button
              key={entry.id}
              type="button"
              title={t(entry.labelKey)}
              aria-label={t(entry.labelKey)}
              aria-pressed={active}
              onClick={() => launch(entry)}
              className={`${dockBtn} relative ${active ? "text-fgaccent bg-fg/10" : ""}`}
            >
              <Icon name={entry.icon} fontSize={20} />
              {active && <span aria-hidden className="absolute -bottom-1 h-1 w-1 rounded-full bg-brand" />}
            </button>
          );
        })}

        {/* ── 分隔符 ── */}
        <span aria-hidden className="mx-1 h-6 w-px bg-line" />

        {/* ── 程序列表（A-Z，向上弹出） ── */}
        <Popover
          label={t("taskbar.appList")}
          placement="above"
          width={280}
          isOpen={appsOpen}
          onOpenChange={setAppsOpen}
          content={
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
              <div className="px-2 pb-2 text-[12px] font-semibold text-fgdim">{t("taskbar.appList")}</div>
              {apps.map((app) => {
                const disabled = app.launch.kind === "disabled";
                return (
                  <button
                    key={app.id}
                    type="button"
                    disabled={disabled}
                    title={disabled ? t("taskbar.comingSoon") : t(app.labelKey)}
                    onClick={() => launch(app)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-fg hover:bg-fg/5 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    <Icon name={app.icon} fontSize={18} className="text-fgdim shrink-0" />
                    <span className="min-w-0 truncate text-[13px]">{t(app.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          }
        >
          <IconButton
            variant="ghost"
            size="lg"
            icon={<Icon name="widgets" fontSize={20} />}
            label={t("taskbar.appList")}
          />
        </Popover>

        {/* ── 运行项：路由 / split / 自由窗口 ── */}
        {routeActive && (
          <button
            type="button"
            data-route-task="true"
            aria-pressed
            title={t("tabs.home")}
            onClick={() => onFlash(activeTabId ?? "route")}
            className={`${dockBtn} relative`}
          >
            <Icon name="home" fontSize={20} />
            <span aria-hidden className="absolute -bottom-1 h-1 w-1 rounded-full bg-brand" />
          </button>
        )}

        {splitConfig && (
          <button
            type="button"
            data-split-task="true"
            aria-pressed={splitActive}
            title={splitConfig.title}
            onClick={() => (splitActive ? onFlash("split") : focusRight())}
            className={`${dockBtn} relative ${splitActive ? "text-fgaccent bg-fg/10" : ""}`}
          >
            <Icon name={splitConfig.icon ?? "tab_move"} fontSize={20} />
            {splitActive && <span aria-hidden className="absolute -bottom-1 h-1 w-1 rounded-full bg-brand" />}
          </button>
        )}

        {windows.map((win) => {
          const active = focusedId === win.id && !win.isMinimized;
          const config = getViewConfig(win.viewType);
          return (
            <button
              key={win.id}
              type="button"
              data-window-task={win.id}
              aria-pressed={active}
              title={config.title}
              onClick={() => (active ? setMinimized(win.id, true) : focusWindow(win.id))}
              className={`${dockBtn} relative ${active ? "text-fgaccent bg-fg/10" : ""} ${win.isMinimized ? "opacity-50" : ""}`}
            >
              <Icon name={config.icon ?? "tab_move"} fontSize={20} />
              {active && <span aria-hidden className="absolute -bottom-1 h-1 w-1 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>
    </footer>
  );
}
