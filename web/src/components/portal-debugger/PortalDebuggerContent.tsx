"use client";

import { memo, useEffect, useState, lazy, Suspense } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Icon } from "@/components/ui/Icon";
import { usePortalDebuggerStore, type PortalDebuggerLeftTab } from "@/stores/portalDebugger";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useRuntimeErrors } from "@/hooks/useRuntimeErrors";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProblemsTab } from "./tabs/ProblemsTab";
import { DebugTab } from "./tabs/DebugTab";
import { HideComponentTab } from "./tabs/HideComponentTab";

const Termity = lazy(() =>
  import("@/components/termity/Termity").then((m) => ({ default: m.Termity }))
);

type LeftTabDef = {
  id: PortalDebuggerLeftTab;
  labelKey: string;
  icon: string;
};

const leftTabs: LeftTabDef[] = [
  { id: "problems", labelKey: "portalDebugger.tabProblems", icon: "error" },
  { id: "hide-component", labelKey: "portalDebugger.tabHideComponent", icon: "eye" },
];

type RightTab = "console" | "termity";

const rightTabs: { id: RightTab; labelKey: string; icon: string }[] = [
  { id: "console", labelKey: "portalDebugger.tabDebug", icon: "terminal" },
  { id: "termity", labelKey: "window.termity", icon: "terminal" },
];

/** 小于该宽度视为小屏设备（手机竖屏 / 窄窗），打开时弹提示 */
const SMALL_SCREEN_THRESHOLD = 768;

function RightPanelFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * PortalDebuggerContent — 桌面端双栏调试台
 * 自由窗口默认 1184×756（见 WindowManager getViewConfig，FreeWindow 按视口自动收缩）。
 * 左栏（默认 2/3）：问题 / 隐藏组件子 Tab；右栏（默认 1/3）：交互控制台 / Termity 子 Tab。
 * 中间分隔条可拖拽调整比例，遵循 SplitView 的 PanelGroup 惯例。
 * Termity 为嵌入模式：不走 openTermity 密码流程（数据库逻辑未就绪前免密直进），
 * 无独立 windowId，exit 命令只提示不关窗。
 */
export const PortalDebuggerContent = memo(function PortalDebuggerContent() {
  const { t } = useI18n();
  const leftTab = usePortalDebuggerStore((s) => s.leftTab);
  const setLeftTab = usePortalDebuggerStore((s) => s.setLeftTab);
  const runtimeErrors = usePortalDebuggerStore((s) => s.runtimeErrors);
  const addRuntimeError = usePortalDebuggerStore((s) => s.addRuntimeError);
  const clearRuntimeErrors = usePortalDebuggerStore((s) => s.clearRuntimeErrors);
  const removeRuntimeError = usePortalDebuggerStore((s) => s.removeRuntimeError);

  // 注册运行时错误捕获（窗口关闭后仍在后台收集，下次打开可见）
  useRuntimeErrors({ onError: addRuntimeError });

  // ── 右栏子 Tab（本地状态；Termity 首次点开后常驻，避免切 Tab 丢历史） ──
  const [rightTab, setRightTab] = useState<RightTab>("console");
  const [termityTouched, setTermityTouched] = useState(false);

  const handleRightTab = (tab: RightTab) => {
    setRightTab(tab);
    if (tab === "termity") setTermityTouched(true);
  };

  // ── 小屏拦截：挂载时量一次视口 ──────────────────────────
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [showSmallScreenWarn, setShowSmallScreenWarn] = useState(false);
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setViewport({ w, h });
    if (w < SMALL_SCREEN_THRESHOLD) setShowSmallScreenWarn(true);
  }, []);

  const handleCloseWindow = () => {
    const { windows, close } = useFreeWindowStore.getState();
    windows
      .filter((win) => win.viewType === "portal_debugger")
      .forEach((win) => close(win.id));
  };

  return (
    <div className="relative h-full min-h-0 bg-white/90 dark:bg-gray-900/90">
      <PanelGroup orientation="horizontal" className="h-full w-full">
        {/* ── 左栏：问题 / 隐藏组件（默认 2/3） ─────────── */}
        <Panel id="pdebug-left" defaultSize={66.7} minSize={40}>
          <div className="flex flex-col h-full min-h-0 min-w-0">
            {/* 左栏子 Tab Bar */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200/20 dark:border-gray-700/20 shrink-0">
              {leftTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
                    transition-all duration-150
                    ${
                      leftTab === tab.id
                        ? "bg-brand/10 text-branddeep dark:text-fgaccent"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-gray-700/40 hover:text-gray-700 dark:hover:text-gray-300"
                    }
                  `}
                >
                  <Icon name={tab.icon} fontSize={13} />
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>

            {/* 左栏内容 */}
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
              {leftTab === "problems" && (
                <ProblemsTab
                  errors={runtimeErrors}
                  onClear={clearRuntimeErrors}
                  onDismiss={removeRuntimeError}
                />
              )}
              {leftTab === "hide-component" && <HideComponentTab />}
            </div>
          </div>
        </Panel>

        {/* ── 分隔条 ─────────────────────────────────────── */}
        <PanelResizeHandle className="w-1.5 rounded-full mx-1.5 hover:bg-brand/20 active:bg-brand/40 transition-colors shrink-0" />

        {/* ── 右栏：交互控制台 / Termity（默认 1/3）──────── */}
        <Panel id="pdebug-right" defaultSize={33.3} minSize={22}>
          <div className="flex flex-col h-full min-h-0 min-w-0 border-l border-gray-200/20 dark:border-gray-700/20">
            {/* 右栏子 Tab Bar */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200/20 dark:border-gray-700/20 shrink-0">
              {rightTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleRightTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
                    transition-all duration-150
                    ${
                      rightTab === tab.id
                        ? "bg-brand/10 text-branddeep dark:text-fgaccent"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-gray-700/40 hover:text-gray-700 dark:hover:text-gray-300"
                    }
                  `}
                >
                  <Icon name={tab.icon} fontSize={13} />
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>

            {/* 右栏内容：双挂载保历史，Termity 延迟到首次点开 */}
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
              <div className={`h-full min-h-0 ${rightTab === "console" ? "" : "hidden"}`}>
                <DebugTab />
              </div>
              {termityTouched && (
                <div className={`h-full min-h-0 ${rightTab === "termity" ? "" : "hidden"}`}>
                  <Suspense fallback={<RightPanelFallback />}>
                    <Termity />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>

      {/* ── 小屏提示弹窗 ─────────────────────────────────── */}
      {showSmallScreenWarn && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-b-[30px]" />
          <div className="relative w-[380px] max-w-full rounded-3xl p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Icon name="warning" className="text-amber-500" fontSize={22} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                {t("portalDebugger.smallScreenTitle")}
              </h3>
            </div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {t("portalDebugger.smallScreenDesc", { width: viewport.w, height: viewport.h })}
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleCloseWindow}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                <Icon name="close" fontSize={15} />
                {t("portalDebugger.smallScreenClose")}
              </button>
              <button
                onClick={() => setShowSmallScreenWarn(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand hover:bg-branddeep text-onbrand shadow-lg shadow-brand/25 transition-all"
              >
                {t("portalDebugger.smallScreenContinue")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
});
