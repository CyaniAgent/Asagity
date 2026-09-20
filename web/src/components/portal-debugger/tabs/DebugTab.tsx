"use client";

import { memo, useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePortalDebuggerStore, type DebugLog } from "@/stores/portalDebugger";
import { useDebugCommands, type DebugCommand } from "@/hooks/useDebugCommands";
import { useI18n } from "@/components/providers/I18nProvider";

const severityStyles: Record<string, { color: string; bg: string }> = {
  info: { color: "text-cyan-500", bg: "bg-cyan-500/10" },
  success: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  warning: { color: "text-amber-500", bg: "bg-amber-500/10" },
  error: { color: "text-red-500", bg: "bg-red-500/10" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function LogItem({ log }: { log: DebugLog }) {
  const style = severityStyles[log.severity] || severityStyles.info;
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 text-[11px] font-mono">
      <span className="text-gray-400 dark:text-gray-500 shrink-0 mt-px">{formatTime(log.timestamp)}</span>
      <span className={`${style.color} shrink-0 mt-px`}>›</span>
      <div className="min-w-0">
        <span className="text-gray-600 dark:text-gray-300">{log.command}</span>
        {log.args.length > 0 && (
          <span className="text-gray-400 dark:text-gray-500"> {log.args.join(" ")}</span>
        )}
        <p className={`${style.color} mt-0.5 break-all`}>{log.result}</p>
      </div>
    </div>
  );
}

function CommandSuggestion({
  cmd,
  onSelect,
}: {
  cmd: DebugCommand;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(cmd.name)}
      className="flex items-start gap-2 px-3 py-1.5 w-full text-left hover:bg-gray-200/30 dark:hover:bg-gray-700/30 rounded-lg transition-colors"
    >
      <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 shrink-0">
        {cmd.name}
      </span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
        {cmd.description}
      </span>
    </button>
  );
}

export const DebugTab = memo(function DebugTab() {
  const { t } = useI18n();
  const debugLogs = usePortalDebuggerStore((s) => s.debugLogs);
  const addDebugLog = usePortalDebuggerStore((s) => s.addDebugLog);
  const clearDebugLogs = usePortalDebuggerStore((s) => s.clearDebugLogs);
  const { commands, executeCommand, getCommandNames } = useDebugCommands();

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // 最新的在顶部
    }
  }, [debugLogs.length]);

  const handleSubmit = useCallback(
    (value?: string) => {
      const cmd = (value ?? input).trim();
      if (!cmd) return;

      const { result } = executeCommand(cmd);
      addDebugLog({
        id: `dbg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        command: cmd.split(/\s+/)[0],
        args: cmd.split(/\s+/).slice(1),
        result: result.message,
        severity: result.severity,
        timestamp: Date.now(),
      });

      // 记录历史
      if (historyRef.current[0] !== cmd) {
        historyRef.current.unshift(cmd);
        if (historyRef.current.length > 50) historyRef.current.pop();
      }
      setHistoryIndex(-1);
      setInput("");
      setShowSuggestions(false);
    },
    [input, executeCommand, addDebugLog]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = Math.min(historyIndex + 1, historyRef.current.length - 1);
        setHistoryIndex(next);
        setInput(historyRef.current[next] || "");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.max(historyIndex - 1, -1);
        setHistoryIndex(next);
        setInput(next === -1 ? "" : historyRef.current[next] || "");
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [historyIndex, handleSubmit]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowSuggestions(val.length > 0);
    setHistoryIndex(-1);
  }, []);

  const filteredCommands = commands.filter(
    (c) => input.length > 0 && c.name.startsWith(input.split(/\s+/)[0].toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Log list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {debugLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Icon name="terminal" fontSize={28} className="text-cyan-500/40" />
            <div className="text-center">
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                {t("portalDebugger.debugEmpty")}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {t("portalDebugger.debugHint")}
              </p>
            </div>
          </div>
        )}
        {[...debugLogs].reverse().map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredCommands.length > 0 && (
        <div className="border-t border-gray-200/30 dark:border-gray-700/30 max-h-[140px] overflow-y-auto custom-scrollbar">
          {filteredCommands.map((cmd) => (
            <CommandSuggestion
              key={cmd.name}
              cmd={cmd}
              onSelect={(name) => {
                setInput(name + " ");
                inputRef.current?.focus();
              }}
            />
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200/30 dark:border-gray-700/30">
        <Icon name="terminal" fontSize={13} className="text-cyan-500 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={t("portalDebugger.debugInputPlaceholder")}
          className="flex-1 bg-transparent text-[12px] text-gray-900 dark:text-gray-100 font-mono placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!input.trim()}
          className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
        >
          <Icon name="send" fontSize={13} />
        </button>
        <button
          onClick={clearDebugLogs}
          disabled={debugLogs.length === 0}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
          title={t("portalDebugger.debugClear")}
        >
          <Icon name="delete" fontSize={13} />
        </button>
      </div>
    </div>
  );
});
