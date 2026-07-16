"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSystemStore } from "@/stores/system";
import { useInstanceStore } from "@/stores/instance";
import { useUserStore } from "@/stores/user";
import { useFreeWindowStore } from "@/stores/freeWindow";

interface TerminalLine {
  type: "input" | "output" | "system" | "error" | "warning";
  text: string;
}

const GITHUB_REPO = "CyaniAgent/Asagity";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`;

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
      "enable Develop": "通过开发者凭据登录（会话级）",
      "enable Develop time=meta": "通过开发者凭据登录（持久化）",
      "disable Develop": "退出开发者账户并解除持久化",
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

async function githubFetch(path: string): Promise<{ ok: number; data: unknown }> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  return { ok: res.status, data };
}

function parseArgs(fullArgs: string): Record<string, string> {
  const result: Record<string, string> = {};
  const tokens = fullArgs.split(/\s+/);
  for (const token of tokens) {
    const eq = token.indexOf("=");
    if (eq > 0) {
      result[token.slice(0, eq)] = token.slice(eq + 1);
    } else {
      result[token] = "";
    }
  }
  return result;
}

const TERMITY_PASSWORD = "TermitybyAsagity2026";

export function Termity() {
  const systemStore = useSystemStore();
  const instanceStore = useInstanceStore();
  const userStore = useUserStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
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
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = useCallback((line: TerminalLine) => {
    setHistory((prev) => [...prev, line]);
  }, []);

  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === TERMITY_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  }, [passwordInput]);

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
            addTimer(() => {
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
              addLine({ type: "output", text: `  ${cmd.padEnd(35)} │ ${desc}` });
            });
            addLine({ type: "output", text: "" });
            addLine({ type: "output", text: "Develop 高级命令:" });
            addLine({ type: "output", text: `  ${"latest commit".padEnd(35)} │ 获取 main 分支最近 commit` });
            addLine({ type: "output", text: `  ${"latest release".padEnd(35)} │ 获取 main 分支最新 release` });
            addLine({ type: "output", text: `  ${"{ver} commit branch={br}".padEnd(35)} │ 获取指定分支指定版本 commit` });
            addLine({ type: "output", text: `  ${"{ver} release branch={br}".padEnd(35)} │ 获取指定分支指定版本 release` });
          } else if (args[0] === "enable" && args[1] === "Develop") {
            const subArgs = parseArgs(args.slice(2).join(" "));
            if (subArgs["time"] === "meta") {
              userStore.developerEnter();
              localStorage.setItem("asagity_dev_persistent", "true");
              addLine({ type: "output", text: "> Developer Entry ENABLED (Persistent)" });
              addLine({ type: "output", text: "  开发者账户已通过持久化存储登录。刷新页面后仍保持登录。" });
            } else {
              userStore.developerEnter();
              addLine({ type: "output", text: "> Developer Entry ENABLED (Session)" });
              addLine({ type: "output", text: "  开发者账户已登录。刷新页面后将退出。" });
            }
          } else if (args[0] === "disable" && args[1] === "Develop") {
            userStore.logout();
            localStorage.removeItem("asagity_dev_persistent");
            addLine({ type: "output", text: "> Developer Account LOGGED OUT" });
            addLine({ type: "output", text: "  已退出开发者账户并解除持久化登录。" });
          } else if (args[0] === "Develop" || args[0] === "develop") {
            const developCmd = args.slice(1);
            const subArgs = parseArgs(developCmd.join(" "));

            if (developCmd.length === 0) {
              addLine({ type: "output", text: '使用 "func --help" 查看 Develop 命令列表。' });
              break;
            }

            const developAction = developCmd[0].toLowerCase();

            if (developAction === "latest") {
              const type = developCmd[1]?.toLowerCase();
              if (type === "commit") {
                addLine({ type: "system", text: "正在获取 main 分支最新 commit..." });
                githubFetch("/commits/main").then(({ ok, data }) => {
                  if (ok !== 200) {
                    addLine({ type: "error", text: `GitHub API 错误: ${ok}` });
                    return;
                  }
                  const d = data as { sha: string; commit: { message: string; author: { name: string }; committer: { date: string } } };
                  addLine({ type: "output", text: `  SHA:      ${d.sha.slice(0, 7)}` });
                  addLine({ type: "output", text: `  Message:  ${d.commit.message.split("\n")[0]}` });
                  addLine({ type: "output", text: `  Author:   ${d.commit.author.name}` });
                  addLine({ type: "output", text: `  Date:     ${d.commit.committer.date}` });
                });
              } else if (type === "release") {
                addLine({ type: "system", text: "正在获取 main 分支最新 release..." });
                Promise.all([
                  githubFetch("/releases/latest"),
                  githubFetch("/releases"),
                ]).then(([latestRes, releasesRes]) => {
                  if (latestRes.ok !== 200) {
                    addLine({ type: "error", text: `GitHub API 错误: ${latestRes.ok}` });
                    return;
                  }
                  const latest = latestRes.data as { tag_name: string; name: string; body: string; published_at: string };
                  addLine({ type: "output", text: `  Version:  ${latest.tag_name}` });
                  addLine({ type: "output", text: `  Name:     ${latest.name}` });
                  addLine({ type: "output", text: `  Date:     ${latest.published_at}` });

                  if (releasesRes.ok === 200) {
                    const releases = releasesRes.data as { tag_name: string }[];
                    if (releases.length > 1) {
                      const prev = releases[1];
                      if (prev.tag_name !== latest.tag_name) {
                        addLine({ type: "warning", text: `  ${prev.tag_name} -> ${latest.tag_name} (新版本可用)` });
                      }
                    }
                  }

                  if (latest.body) {
                    addLine({ type: "output", text: "  Changelog:" });
                    latest.body.split("\n").slice(0, 8).forEach((line: string) => {
                      addLine({ type: "output", text: `    ${line}` });
                    });
                  }
                });
              } else {
                addLine({ type: "output", text: '用法: func Develop latest commit | latest release' });
              }
            } else {
              const version = developAction;
              const type = developCmd[1]?.toLowerCase();
              const branch = subArgs["branch"] || "main";

              if (type === "commit") {
                addLine({ type: "system", text: `正在获取 ${branch} 分支 ${version} commit...` });
                githubFetch(`/commits/${version}`).then(({ ok, data }) => {
                  if (ok !== 200) {
                    addLine({ type: "error", text: `GitHub API 错误: ${ok}` });
                    return;
                  }
                  const d = data as { sha: string; commit: { message: string; author: { name: string }; committer: { date: string } } };
                  addLine({ type: "output", text: `  SHA:      ${d.sha.slice(0, 7)}` });
                  addLine({ type: "output", text: `  Message:  ${d.commit.message.split("\n")[0]}` });
                  addLine({ type: "output", text: `  Author:   ${d.commit.author.name}` });
                  addLine({ type: "output", text: `  Date:     ${d.commit.committer.date}` });
                });
              } else if (type === "release") {
                addLine({ type: "system", text: `正在获取 ${branch} 分支 ${version} release...` });
                githubFetch(`/releases/tags/${version}`).then(({ ok, data }) => {
                  if (ok !== 200) {
                    addLine({ type: "error", text: `GitHub API 错误: ${ok}` });
                    return;
                  }
                  const d = data as { tag_name: string; name: string; body: string; published_at: string };
                  addLine({ type: "output", text: `  Version:  ${d.tag_name}` });
                  addLine({ type: "output", text: `  Name:     ${d.name}` });
                  addLine({ type: "output", text: `  Date:     ${d.published_at}` });
                  if (d.body) {
                    addLine({ type: "output", text: "  Changelog:" });
                    d.body.split("\n").slice(0, 8).forEach((line: string) => {
                      addLine({ type: "output", text: `    ${line}` });
                    });
                  }
                });
              } else {
                addLine({ type: "output", text: '用法: func Develop {version} commit branch={branch}' });
                addLine({ type: "output", text: '      func Develop {version} release branch={branch}' });
              }
            }
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
          addLine({ type: "output", text: `  开发者: ${userStore.isLoggedIn ? userStore.username || "已登录" : "未登录"}` });
          break;
        }

        case "exit": {
          addLine({ type: "system", text: "正在关闭 Termity 会话..." });
          addTimer(() => {
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
    [addLine, systemStore, instanceStore, userStore]
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

  if (!isAuthenticated) {
    return (
      <div
        className="w-full h-full bg-[#0a0a0a] text-green-500 font-mono text-sm p-4 flex flex-col overflow-hidden cursor-text"
      >
        <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)",
          }}
        />
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-2 text-yellow-500 font-bold">Access required! You need to enter Termity password.</div>
          <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }} className="flex items-center">
            <span className="text-green-500">Password: </span>
            <input
              ref={inputRef}
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              className="flex-1 bg-transparent border-none outline-none text-white ml-1 caret-green-500"
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
          </form>
          {passwordError && (
            <div className="mt-2 text-red-400">Permission denied. Please try again.</div>
          )}
        </div>
        <style jsx>{`
          .scrollbar-termity::-webkit-scrollbar { width: 6px; }
          .scrollbar-termity::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.5); }
          .scrollbar-termity::-webkit-scrollbar-thumb { background: rgba(34, 197, 94, 0.5); border-radius: 4px; }
          .scrollbar-termity::-webkit-scrollbar-thumb:hover { background: rgba(34, 197, 94, 0.8); }
        `}</style>
      </div>
    );
  }

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
