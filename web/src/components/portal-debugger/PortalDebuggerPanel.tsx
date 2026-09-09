"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";
import { ReactLintTab, type LintIssue } from "./tabs/ReactLintTab";

type TabDef = {
  id: string;
  label: string;
  icon: string;
};

const tabs: TabDef[] = [
  { id: "react-lint", label: "React Lint", icon: "wand" },
];

function DemoLintScanner({ onResult }: { onResult: (issues: LintIssue[]) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onResult([
        {
          id: "demo-1",
          severity: "warning",
          message: "React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array.",
          file: "src/components/timeline/TimelineFeed.tsx",
          line: 42,
          column: 5,
          rule: "react-hooks/exhaustive-deps",
          source: "eslint",
        },
        {
          id: "demo-2",
          severity: "error",
          message: "Cannot read properties of undefined (reading 'map'). Ensure data is initialized before rendering.",
          file: "src/components/post/PostItem.tsx",
          line: 87,
          column: 12,
          rule: "react/no-undefined-as-props",
          source: "react-compiler",
        },
        {
          id: "demo-3",
          severity: "info",
          message: "Component 'PostItem' can be wrapped in React.memo to avoid re-renders when props haven't changed.",
          file: "src/components/post/PostItem.tsx",
          line: 1,
          column: 1,
          rule: "react memo",
          source: "custom",
        },
        {
          id: "demo-4",
          severity: "warning",
          message: "Unused import: 'useState' in 'src/components/drive/DriveFileList.tsx'. Remove it to reduce bundle size.",
          file: "src/components/drive/DriveFileList.tsx",
          line: 3,
          column: 10,
          rule: "no-unused-vars",
          source: "eslint",
        },
        {
          id: "demo-5",
          severity: "info",
          message: "Inline style object created on every render. Consider memoizing with useMemo.",
          file: "src/components/music/MusicPlayer.tsx",
          line: 156,
          column: 8,
          rule: "custom",
          source: "custom",
        },
      ]);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

export const PortalDebuggerPanel = memo(function PortalDebuggerPanel() {
  const isOpen = usePortalDebuggerStore((s) => s.isOpen);
  const activeTab = usePortalDebuggerStore((s) => s.activeTab);
  const setActiveTab = usePortalDebuggerStore((s) => s.setActiveTab);
  const close = usePortalDebuggerStore((s) => s.close);

  const panelRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);

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

  const handleLintRefresh = useCallback(() => {
    setIsScanning(true);
    setLintIssues([]);
  }, []);

  const handleLintClear = useCallback(() => {
    setLintIssues([]);
  }, []);

  const handleLintResult = useCallback((issues: LintIssue[]) => {
    setLintIssues(issues);
    setIsScanning(false);
  }, []);

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
            Portal Debugger
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "react-lint" && (
          <ReactLintTab
            issues={lintIssues}
            onClear={handleLintClear}
            onRefresh={handleLintRefresh}
            isScanning={isScanning}
          />
        )}
      </div>

      {/* Demo scanner trigger */}
      {activeTab === "react-lint" && isScanning && (
        <DemoLintScanner onResult={handleLintResult} />
      )}
    </div>,
    document.body
  );
});
