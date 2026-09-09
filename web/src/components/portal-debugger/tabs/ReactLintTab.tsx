"use client";

import { memo } from "react";
import { Icon } from "@/components/ui/Icon";

export interface LintIssue {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  rule?: string;
  source: "react-compiler" | "eslint" | "custom";
}

interface ReactLintTabProps {
  issues: LintIssue[];
  onClear: () => void;
  onRefresh: () => void;
  isScanning: boolean;
}

const severityConfig = {
  error: {
    icon: "error",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Error",
  },
  warning: {
    icon: "warning",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Warning",
  },
  info: {
    icon: "info",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    label: "Info",
  },
} as const;

const sourceLabels: Record<string, string> = {
  "react-compiler": "React Compiler",
  eslint: "ESLint",
  custom: "Custom",
};

function LintIssueItem({ issue }: { issue: LintIssue }) {
  const config = severityConfig[issue.severity];

  return (
    <div
      className={`
        flex items-start gap-3 px-3 py-2.5 rounded-xl
        border ${config.border} ${config.bg}
        transition-colors duration-150
        hover:brightness-110
      `}
    >
      <Icon name={config.icon} fontSize={16} className={`${config.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-gray-900 dark:text-gray-100 leading-snug">
          {issue.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {issue.file && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
              {issue.file}
              {issue.line ? `:${issue.line}` : ""}
              {issue.column ? `:${issue.column}` : ""}
            </span>
          )}
          {issue.rule && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
              {issue.rule}
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {sourceLabels[issue.source] || issue.source}
          </span>
        </div>
      </div>
    </div>
  );
}

export const ReactLintTab = memo(function ReactLintTab({
  issues,
  onClear,
  onRefresh,
  isScanning,
}: ReactLintTabProps) {
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500">
                <Icon name="error" fontSize={11} />
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500">
                <Icon name="warning" fontSize={11} />
                {warningCount}
              </span>
            )}
            {infoCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-500">
                <Icon name="info" fontSize={11} />
                {infoCount}
              </span>
            )}
            {issues.length === 0 && !isScanning && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                No issues found
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isScanning}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            title="Scan again"
          >
            <Icon
              name="refresh"
              fontSize={14}
              className={isScanning ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={onClear}
            disabled={issues.length === 0}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            title="Clear issues"
          >
            <Icon name="delete" fontSize={14} />
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 custom-scrollbar">
        {isScanning && issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[12px] text-gray-400 dark:text-gray-500">
              Scanning components...
            </span>
          </div>
        )}
        {!isScanning && issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Icon name="check_circle" fontSize={28} className="text-emerald-500/60" />
            <div className="text-center">
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                All clean!
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                No React issues detected
              </p>
            </div>
          </div>
        )}
        {issues.map((issue) => (
          <LintIssueItem key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
});
