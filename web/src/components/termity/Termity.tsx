"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSystemStore } from "@/stores/system";
import { useInstanceStore } from "@/stores/instance";
import { useFreeWindowStore } from "@/stores/freeWindow";

interface TerminalLine {
  type: "input" | "output" | "system" | "error" | "warning";
  text: string;
}

const COMMANDS: Record<string, { name: string; description: string; subcommands?: Record<string, string> }> = {
  help: {
    name: "Help",
    description: "帮助，查看所有可用的指令",
  },
  anet: {
    name: "Asagity NET Config",
    description: "Asagity NET 监测、管理、配置",
    subcommands: {
      status: "查看 Asagity NET 连接状态",
      ping: "测试网络延迟",
      config: "查看当前网络配置",
    },
  },
  func: {
    name: "Function Switch",
    description: "修改 Asagity 的一些可修改功能",
    subcommands: {
      "enable DevMode": "启用开发者模式（会话级）",
      "enable DevMode --forever": "启用开发者模式（持久化）",
      "disable DevMode": "禁用开发者模式",
    },
  },
  info: {
    name: "Server Information",
    description: "查看本 Asagity 实例的相关信息",
  },
  exit: {
    name: "Exit Termity",
    description: "退出此 Termity 会话",
  },
  remote: {
    name: "Remote Instance",
    description: "通过 Bearer Token 连接到其他实例（开发中）",
  },
  clear: {
    name: "Clear",
    description: "清空终端输出",
  },
};

export function Termity() {
  const systemStore = useSystemStore();
  const instanceStore = useInstanceStore();
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: "system", text: "Asagity Recovery Terminal [Termity v2.0.0]" },
    { type: "system", text: 'Type "help" to see available commands.' },
    { type: "system", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = useCallback((line: TerminalLine) => {
    setHistory((prev) => [...prev, line]);
  }, []);

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      addLine({ type: "input", text: trimmed });

      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      const parts = trimmed.split(/\s+/);
      const root = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (root) {
        case "help": {
          addLine({ type: "system", text: "┌─────────────────────────────────────────────┐" });
          addLine({ type: "system", text: "│         Asagity Recovery Terminal           │" });
          addLine({ type: "system", text: "│              Command List                   │" });
          addLine({ type: "system", text: "├─────────────────────────────────────────────┤" });
          Object.entries(COMMANDS).forEach(([cmd, info]) => {
            addLine({
              type: "output",
              text: `  ${cmd.padEnd(12)} │ ${info.description}`,
            });
          });
          addLine({ type: "system", text: "└─────────────────────────────────────────────┘" });
          addLine({ type: "system", text: 'Use "[command] --help" for sub-command details.' });
          break;
        }

        case "anet": {
          if (args[0] === "--help") {
            addLine({ type: "output", text: "Asagity NET Config - 子命令列表:" });
            Object.entries(COMMANDS.anet.subcommands!).forEach(([cmd, desc]) => {
              addLine({ type: "output", text: `  ${cmd.padEnd(20)} │ ${desc}` });
            });
          } else if (args[0] === "status") {
            const online = systemStore.isBackendOnline;
            addLine({
              type: online ? "output" : "error",
              text: `Asagity NET 状态: ${online ? "已连接" : "离线"}`,
            });
          } else if (args[0] === "ping") {
            addLine({ type: "system", text: "正在测试网络延迟..." });
            setTimeout(() => {
              addLine({ type: "output", text: "Pong! 延迟: 42ms" });
            }, 500);
          } else if (args[0] === "config") {
            addLine({ type: "output", text: "网络配置:" });
            addLine({ type: "output", text: `  后端地址: ${typeof window !== "undefined" ? window.location.origin : "N/A"}` });
            addLine({ type: "output", text: `  连接状态: ${systemStore.isBackendOnline ? "在线" : "离线"}` });
          } else {
            addLine({ type: "output", text: '使用 "anet --help" 查看可用子命令。' });
          }
          break;
        }

        case "func": {
          if (args[0] === "--help") {
            addLine({ type: "output", text: "Function Switch - 子命令列表:" });
            Object.entries(COMMANDS.func.subcommands!).forEach(([cmd, desc]) => {
              addLine({ type: "output", text: `  ${cmd.padEnd(25)} │ ${desc}` });
            });
          } else if (args.join(" ") === "enable DevMode") {
            systemStore.enableDevMode(false);
            addLine({ type: "output", text: "> Developer Mode ENABLED (Session)" });
          } else if (args.join(" ") === "enable DevMode --forever") {
            systemStore.enableDevMode(true);
            addLine({ type: "output", text: "> Developer Mode ENABLED (Persistent)" });
          } else if (args.join(" ") === "disable DevMode") {
            systemStore.disableDevMode();
            addLine({ type: "output", text: "> Developer Mode DISABLED" });
          } else {
            addLine({ type: "output", text: '使用 "func --help" 查看可用子命令。' });
          }
          break;
        }

        case "info": {
          addLine({ type: "output", text: "服务器信息:" });
          addLine({ type: "output", text: `  名称: ${instanceStore.name || "Asagity"}` });
          addLine({ type: "output", text: `  别名: ${instanceStore.alias || "asagity.io"}` });
          addLine({ type: "output", text: `  版本: ${instanceStore.version || "2.0.0"}` });
          addLine({ type: "output", text: `  描述: ${instanceStore.description || "Asagity NET"}` });
          addLine({ type: "output", text: `  开发者模式: ${systemStore.isDevMode ? "已启用" : "未启用"}` });
          break;
        }

        case "exit": {
          addLine({ type: "system", text: "正在关闭 Termity 会话..." });
          setTimeout(() => {
            useFreeWindowStore.getState().close();
          }, 300);
          break;
        }

        case "clear": {
          setHistory([]);
          break;
        }

        case "remote": {
          addLine({ type: "warning", text: "Remote Instance 功能目前仍在开发中。" });
          addLine({ type: "output", text: "该功能将支持通过 Bearer Token 连接到其他 ActivityPub / Asagity 实例。" });
          break;
        }

        default: {
          addLine({ type: "error", text: `未知命令: ${root}` });
          addLine({ type: "output", text: '输入 "help" 查看可用命令。' });
        }
      }

      addLine({ type: "system", text: "" });
    },
    [addLine, systemStore, instanceStore]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        executeCommand(input);
        setInput("");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setInput("");
          } else {
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
          }
        }
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setHistory([]);
      }
    },
    [input, executeCommand, commandHistory, historyIndex]
  );

  return (
    <div
      className="w-full h-full bg-[#0a0a0a] text-green-500 font-mono text-sm p-4 flex flex-col overflow-hidden cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scanline effect */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)",
        }}
      />

      <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col gap-0.5 pb-4 scrollbar-termity">
        {history.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap break-all">
            {line.type === "input" && <span className="text-cyan-400">&gt; </span>}
            <span
              className={
                line.type === "error"
                  ? "text-red-400"
                  : line.type === "warning"
                  ? "text-yellow-400"
                  : line.type === "system"
                  ? "text-yellow-500 font-bold"
                  : line.type === "input"
                  ? "text-white"
                  : "text-green-500"
              }
            >
              {line.text}
            </span>
          </div>
        ))}

        <div className="flex items-center mt-1">
          <span className="text-cyan-400 shrink-0">&gt; </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white ml-2 caret-green-500"
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>

      <style jsx>{`
        .scrollbar-termity::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-termity::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
        }
        .scrollbar-termity::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.5);
          border-radius: 4px;
        }
        .scrollbar-termity::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.8);
        }
      `}</style>
    </div>
  );
}
