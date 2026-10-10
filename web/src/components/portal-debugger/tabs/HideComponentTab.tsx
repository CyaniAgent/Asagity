"use client";

import { memo, useState, useMemo, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";
import { useComponentScanner, type ScannedNode, type ProtectedNode } from "@/hooks/useComponentScanner";
import { useI18n } from "@/components/providers/I18nProvider";

function isProtectedSelector(selector: string): boolean {
  const s = selector.trim().toLowerCase();
  return (
    s === "body" ||
    s === "html" ||
    s.startsWith("body.") ||
    s.startsWith("body:") ||
    s.startsWith("body[") ||
    s.startsWith("html.") ||
    s.startsWith("html:") ||
    s.startsWith("html[")
  );
}

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

function ProtectedItem({ node, reasonText }: { node: ProtectedNode; reasonText: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200/30 dark:border-gray-700/30 bg-gray-100/50 dark:bg-gray-800/30">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gray-200/60 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        title={reasonText}
      >
        <Icon name="lock" fontSize={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-700 dark:text-gray-300 font-medium truncate">
            {node.label}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
            {node.childCount > 0 && `${node.childCount} children`}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate block">
          {node.selector}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate block mt-0.5">
          {reasonText}
        </span>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-500/10 text-gray-400 dark:text-gray-500 shrink-0">
        Locked
      </span>
    </div>
  );
}

export const HideComponentTab = memo(function HideComponentTab() {
  const { t } = useI18n();
  const hiddenSelectors = usePortalDebuggerStore((s) => s.hiddenSelectors);
  const toggleComponentHide = usePortalDebuggerStore((s) => s.toggleComponentHide);
  const resetHiddenComponents = usePortalDebuggerStore((s) => s.resetHiddenComponents);
  const { nodes, protectedNodes, isScanning, refresh } = useComponentScanner();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "protected">("list");

  // 应用隐藏样式到 DOM（含 body/html 熔断 + 陈旧 body 隐藏自愈）
  useEffect(() => {
    // 注入样式规则（仅一次）
    const styleId = "pdebug-hide-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `[data-pdebug-hidden="true"] { display: none !important; }`;
      document.head.appendChild(style);
    }

    // 自愈：如果 body/html 被误藏（旧版本存档），强制恢复
    // 注意 hiddenSelectors 不持久化，刷新即恢复；这里处理同会话内的陈旧值
    const staleProtected = hiddenSelectors.filter(isProtectedSelector);
    if (staleProtected.length > 0) {
      document.body.removeAttribute("data-pdebug-hidden");
      document.documentElement.removeAttribute("data-pdebug-hidden");
      // 剔除受保护的 selector，下一次 effect 不再尝试隐藏
      usePortalDebuggerStore.setState((s) => ({
        hiddenSelectors: s.hiddenSelectors.filter((sel) => !isProtectedSelector(sel)),
      }));
      return;
    }

    // 对所有已扫描节点设置 data 属性（跳过受保护节点 + 解析到 BODY/HTML 的节点）
    nodes.forEach((node) => {
      if (isProtectedSelector(node.selector)) return;
      let el: Element | null = null;
      try {
        el = document.querySelector(node.selector);
      } catch {
        return;
      }
      if (!el) return;
      const tag = el.tagName.toLowerCase();
      if (tag === "body" || tag === "html") return;
      const shouldHide = hiddenSelectors.includes(node.selector);
      el.setAttribute("data-pdebug-hidden", shouldHide ? "true" : "false");
    });

    return () => {
      // 清理：恢复所有元素
      nodes.forEach((node) => {
        let el: Element | null = null;
        try {
          el = document.querySelector(node.selector);
        } catch {
          return;
        }
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

  const reasonTextOf = (reason: ProtectedNode["reason"]) => {
    switch (reason) {
      case "html":
        return t("portalDebugger.protectedReasonHtml");
      case "body":
        return t("portalDebugger.protectedReasonBody");
      case "root":
        return t("portalDebugger.protectedReasonRoot");
      case "portal":
        return t("portalDebugger.protectedReasonPortal");
      default:
        return "";
    }
  };

  // ── 受保护子页 ──────────────────────────────────────────────
  if (view === "protected") {
    return (
      <div className="flex flex-col h-full">
        {/* Sub-page header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200/30 dark:border-gray-700/30 shrink-0">
          <button
            onClick={() => setView("list")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            title={t("common.back")}
          >
            <Icon name="arrow_left" fontSize={14} />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon name="shield" fontSize={14} className="text-cyan-500 shrink-0" />
            <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate">
              {t("portalDebugger.protectedTitle")}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
              {protectedNodes.length}
            </span>
          </div>
        </div>
        <p className="px-3 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 border-b border-gray-200/20 dark:border-gray-700/20 shrink-0">
          {t("portalDebugger.protectedDesc")}
        </p>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 custom-scrollbar">
          {protectedNodes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Icon name="shield" fontSize={28} className="text-gray-300 dark:text-gray-600" />
              <p className="text-[12px] text-gray-400 dark:text-gray-500">
                {t("portalDebugger.protectedEmpty")}
              </p>
            </div>
          )}
          {protectedNodes.map((node) => (
            <ProtectedItem key={node.id} node={node} reasonText={reasonTextOf(node.reason)} />
          ))}
        </div>
      </div>
    );
  }

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

      {/* Footer: protected entry */}
      <div className="shrink-0 border-t border-gray-200/30 dark:border-gray-700/30 px-2 py-2">
        <button
          onClick={() => setView("protected")}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl border border-dashed border-gray-300/60 dark:border-gray-600/60 text-left hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors group"
        >
          <Icon
            name="shield"
            fontSize={15}
            className="text-gray-400 dark:text-gray-500 group-hover:text-cyan-500 shrink-0 transition-colors"
          />
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate transition-colors">
              {t("portalDebugger.protectedTitle")}
            </span>
            <span className="block text-[10px] text-gray-400 dark:text-gray-500 truncate">
              {t("portalDebugger.protectedDesc")}
            </span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-500/10 text-gray-500 dark:text-gray-400 shrink-0">
            {protectedNodes.length}
          </span>
          <Icon name="chevron_right" fontSize={14} className="text-gray-400 shrink-0" />
        </button>
      </div>
    </div>
  );
});
