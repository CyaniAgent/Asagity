"use client";

import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";
import { useRuntimeErrors } from "@/hooks/useRuntimeErrors";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProblemsTab } from "./tabs/ProblemsTab";
import { DebugTab } from "./tabs/DebugTab";
import { HideComponentTab } from "./tabs/HideComponentTab";

type TabDef = {
  id: string;
  labelKey: string;
  icon: string;
};

const tabs: TabDef[] = [
  { id: "problems", labelKey: "portalDebugger.tabProblems", icon: "error" },
  { id: "debug", labelKey: "portalDebugger.tabDebug", icon: "terminal" },
  { id: "hide-component", labelKey: "portalDebugger.tabHideComponent", icon: "eye" },
];

export const PortalDebuggerPanel = memo(function PortalDebuggerPanel() {
  const { t } = useI18n();
  const isOpen = usePortalDebuggerStore((s) => s.isOpen);
  const activeTab = usePortalDebuggerStore((s) => s.activeTab);
  const setActiveTab = usePortalDebuggerStore((s) => s.setActiveTab);
  const close = usePortalDebuggerStore((s) => s.close);
  const runtimeErrors = usePortalDebuggerStore((s) => s.runtimeErrors);
  const addRuntimeError = usePortalDebuggerStore((s) => s.addRuntimeError);
  const clearRuntimeErrors = usePortalDebuggerStore((s) => s.clearRuntimeErrors);
  const removeRuntimeError = usePortalDebuggerStore((s) => s.removeRuntimeError);

  const panelRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // 注册运行时错误捕获
  useRuntimeErrors({ onError: addRuntimeError });

  // Open / close animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, close]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={`
        fixed bottom-[68px] left-5 z-[9998]
        w-[420px] max-h-[calc(100vh-120px)]
        flex flex-col
        bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl
        border border-gray-200/50 dark:border-gray-800/80
        rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.15)]
        transition-all duration-200 ease-out
        origin-bottom-left
        ${isAnimating ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.97]"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-2">
          <Icon name="terminal" fontSize={16} className="text-cyan-500" />
          <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
            {t("portalDebugger.title")}
          </span>
        </div>
        <button
          onClick={close}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <Icon name="close" fontSize={14} />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200/20 dark:border-gray-700/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
              transition-all duration-150
              ${
                activeTab === tab.id
                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-gray-700/40 hover:text-gray-700 dark:hover:text-gray-300"
              }
            `}
          >
            <Icon name={tab.icon} fontSize={13} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "problems" && (
          <ProblemsTab
            errors={runtimeErrors}
            onClear={clearRuntimeErrors}
            onDismiss={removeRuntimeError}
          />
        )}
        {activeTab === "debug" && <DebugTab />}
        {activeTab === "hide-component" && <HideComponentTab />}
      </div>
    </div>,
    document.body
  );
});
