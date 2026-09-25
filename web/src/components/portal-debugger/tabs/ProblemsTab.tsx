"use client";

import { memo, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import type { RuntimeError } from "@/hooks/useRuntimeErrors";
import { useI18n } from "@/components/providers/I18nProvider";

interface ProblemsTabProps {
  errors: RuntimeError[];
  onClear: () => void;
  onDismiss: (id: string) => void;
}

const typeConfig = {
  "js-error": {
    icon: "error",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  "unhandled-rejection": {
    icon: "warning",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  "console-error": {
    icon: "error",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  "render-error": {
    icon: "error",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
} as const;

const typeLabels: Record<string, string> = {
  "js-error": "JS Error",
  "unhandled-rejection": "Promise Rejection",
  "console-error": "Console Error",
  "render-error": "Render Error",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function extractFilename(filename?: string): string | undefined {
  if (!filename) return undefined;
  const idx = filename.indexOf("/src/");
  if (idx !== -1) return filename.slice(idx + 1);
  const webIdx = filename.indexOf("/web/");
  if (webIdx !== -1) return filename.slice(webIdx + 5);
  const parts = filename.split("/");
  return parts[parts.length - 1] || undefined;
}

function ErrorItem({ error, onDismiss }: { error: RuntimeError; onDismiss: (id: string) => void }) {
  const config = typeConfig[error.type];

  return (
    <div
      className={`
        flex items-start gap-2.5 px-3 py-2.5 rounded-xl
        border ${config.border} ${config.bg}
        group transition-colors duration-150
      `}
    >
      <Icon name={config.icon} fontSize={15} className={`${config.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-gray-900 dark:text-gray-100 leading-snug break-all">
          {error.message}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {error.filename && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate max-w-[200px]">
              {extractFilename(error.filename)}
              {error.lineno ? `:${error.lineno}` : ""}
              {error.colno ? `:${error.colno}` : ""}
            </span>
          )}
          <span
            className={`
              text-[10px] px-1.5 py-0.5 rounded-md shrink-0
              ${config.bg} ${config.color}
            `}
          >
            {typeLabels[error.type]}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
            {formatTime(error.timestamp)}
          </span>
        </div>
        {error.componentStack && (
          <details className="mt-1.5 group/details">
            <summary className="text-[10px] text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
              Component Stack
            </summary>
            <pre className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-mono whitespace-pre-wrap break-all max-h-[80px] overflow-y-auto custom-scrollbar">
              {error.componentStack}
            </pre>
          </details>
        )}
        {error.stack && !error.componentStack && (
          <details className="mt-1.5 group/details">
            <summary className="text-[10px] text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
              Stack Trace
            </summary>
            <pre className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-mono whitespace-pre-wrap break-all max-h-[80px] overflow-y-auto custom-scrollbar">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
      <button
        onClick={() => onDismiss(error.id)}
        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Icon name="close" fontSize={11} />
      </button>
    </div>
  );
}

export const ProblemsTab = memo(function ProblemsTab({
  errors,
  onClear,
  onDismiss,
}: ProblemsTabProps) {
  const { t } = useI18n();
  const stats = useMemo(() => {
    const errorCount = errors.filter((e) => e.severity === "error").length;
    const warningCount = errors.filter((e) => e.severity === "warning").length;
    return { errorCount, warningCount };
  }, [errors]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-2">
          {stats.errorCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500">
              <Icon name="error" fontSize={11} />
              {stats.errorCount}
            </span>
          )}
          {stats.warningCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500">
              <Icon name="warning" fontSize={11} />
              {stats.warningCount}
            </span>
          )}
          {errors.length === 0 && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {t("portalDebugger.problemsEmpty")}
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          disabled={errors.length === 0}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
          title={t("portalDebugger.clearAll")}
        >
          <Icon name="delete" fontSize={13} />
        </button>
      </div>

      {/* Errors List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 custom-scrollbar">
        {errors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Icon name="check_circle" fontSize={28} className="text-emerald-500/60" />
            <div className="text-center">
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                {t("portalDebugger.allClean")}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {t("portalDebugger.noErrorsDetected")}
              </p>
            </div>
          </div>
        )}
        {errors.map((error) => (
          <ErrorItem key={error.id} error={error} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
});
