"use client";

import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";
import { useComponentScanner, type ScannedNode } from "@/hooks/useComponentScanner";
import { useI18n } from "@/components/providers/I18nProvider";

function ComponentItem({
  node,
  isHidden,
  onToggle,
}: {
  node: ScannedNode;
  isHidden: boolean;
  onToggle: (selector: string) => void;
}) {
  return (
    <div
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors duration-150
        ${
          isHidden
            ? "border-amber-500/20 bg-amber-500/5"
            : "border-gray-200/30 dark:border-gray-700/30 bg-white/50 dark:bg-gray-800/50"
        }
      `}
    >
      <button
        onClick={() => onToggle(node.selector)}
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
          ${
            isHidden
              ? "bg-amber-500/10 text-amber-500"
              : "bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-500"
          }
        `}
        title={isHidden ? "Click to show" : "Click to hide"}
      >
        <Icon name={isHidden ? "eye" : "eye"} fontSize={13} className={isHidden ? "opacity-40" : ""} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-900 dark:text-gray-100 font-medium truncate">
            {node.label}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
            {node.childCount > 0 && `${node.childCount} children`}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate block">
          {node.selector}
        </span>
      </div>
      {isHidden && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
          Hidden
        </span>
      )}
    </div>
  );
}

export const HideComponentTab = memo(function HideComponentTab() {
  const { t } = useI18n();
  const hiddenSelectors = usePortalDebuggerStore((s) => s.hiddenSelectors);
  const toggleComponentHide = usePortalDebuggerStore((s) => s.toggleComponentHide);
  const resetHiddenComponents = usePortalDebuggerStore((s) => s.resetHiddenComponents);
  const { nodes, isScanning, refresh } = useComponentScanner();
  const [search, setSearch] = useState("");

  // 应用隐藏样式到 DOM
  useEffect(() => {
    // 注入样式规则（仅一次）
    const styleId = "pdebug-hide-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `[data-pdebug-hidden="true"] { display: none !important; }`;
      document.head.appendChild(style);
    }

    // 对所有已扫描节点设置 data 属性
    nodes.forEach((node) => {
      const el = document.querySelector(node.selector);
      if (el) {
        const shouldHide = hiddenSelectors.includes(node.selector);
        el.setAttribute("data-pdebug-hidden", shouldHide ? "true" : "false");
      }
    });

    return () => {
      // 清理：恢复所有元素
      nodes.forEach((node) => {
        const el = document.querySelector(node.selector);
        if (el) el.removeAttribute("data-pdebug-hidden");
      });
    };
  }, [hiddenSelectors, nodes]);

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.selector.toLowerCase().includes(q) ||
        n.tagName.toLowerCase().includes(q)
    );
  }, [nodes, search]);

  const hiddenCount = hiddenSelectors.length;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500">
              <Icon name="eye" fontSize={11} className="opacity-60" />
              {hiddenCount}
            </span>
          )}
          {hiddenCount === 0 && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {nodes.length} {t("portalDebugger.componentsFound")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            title={t("portalDebugger.rescan")}
          >
            <Icon name="refresh" fontSize={13} className={isScanning ? "animate-spin" : ""} />
          </button>
          <button
            onClick={resetHiddenComponents}
            disabled={hiddenCount === 0}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            title={t("portalDebugger.resetAll")}
          >
            <Icon name="refresh" fontSize={13} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200/20 dark:border-gray-700/20">
        <Icon name="search" fontSize={13} className="text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("portalDebugger.hideSearch")}
          className="flex-1 bg-transparent text-[12px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
          spellCheck={false}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon name="close" fontSize={11} />
          </button>
        )}
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 custom-scrollbar">
        {isScanning && nodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[12px] text-gray-400 dark:text-gray-500">
              {t("portalDebugger.scanning")}
            </span>
          </div>
        )}
        {!isScanning && filteredNodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Icon name="eye" fontSize={28} className="text-gray-300 dark:text-gray-600" />
            <div className="text-center">
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                {t("portalDebugger.hideComponentEmpty")}
              </p>
            </div>
          </div>
        )}
        {filteredNodes.map((node) => (
          <ComponentItem
            key={node.id}
            node={node}
            isHidden={hiddenSelectors.includes(node.selector)}
            onToggle={toggleComponentHide}
          />
        ))}
      </div>
    </div>
  );
});
