"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSystemStore } from "@/stores/system";
import { useInstanceStore } from "@/stores/instance";
import { useUserStore } from "@/stores/user";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useLocaleStore, localeNames, type Locale } from "@/stores/locale";
import { useI18n } from "@/components/providers/I18nProvider";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";
import { fetchBackend } from "@/lib/backend";
import { executeDebugCommand, getDebugCommandNames } from "@/lib/debugCommands";
import { useTermityHistoryStore } from "@/stores/termityHistory";
import { findHistorySuggestion, suggestionSuffix, acceptWord } from "@/lib/termitySuggest";

interface TerminalLine {
  type: "input" | "output" | "system" | "error" | "warning";
  text: string;
}

function getCommands(t: (key: string) => string): Record<string, { name: string; description: string; subcommands?: Record<string, string> }> {
  return {
    help: {
      name: "Help",
      description: t("termity.cmdHelp"),
    },
    vnet: {
      name: "Verse NET",
      description: t("termity.cmdVnet"),
      subcommands: {
        status: t("termity.vnetSubStatus"),
        ping: t("termity.vnetSubPing"),
        config: t("termity.vnetSubConfig"),
      },
    },
    auth: {
      name: "Account",
      description: t("termity.cmdAuth"),
      subcommands: {
        info: t("termity.authSubInfo"),
        devices: t("termity.authSubDevices"),
        tokens: t("termity.authSubTokens"),
        linked: t("termity.authSubLinked"),
        logout: t("termity.authSubLogout"),
      },
    },
    func: {
      name: "Function Switch",
      description: t("termity.cmdFunc"),
      subcommands: {
        "enable System.Develop [time=meta]": t("termity.funcSubDevEnable"),
        "disable System.Develop": t("termity.funcSubDevDisable"),
        "show System.PortalDebugger": t("termity.funcSubPdebugShow"),
        "hide System.PortalDebugger": t("termity.funcSubPdebugHide"),
        "switch System.Locale {locale}": t("termity.funcSubLangSwitch"),
        "current System.Locale": t("termity.funcSubLangCurrent"),
      },
    },
    time: {
      name: "Time",
      description: t("termity.cmdTime"),
    },
    date: {
      name: "Date",
      description: t("termity.cmdDate"),
    },
    whoami: {
      name: "Who Am I",
      description: t("termity.cmdWhoami"),
    },
    info: {
      name: "Server Information",
      description: t("termity.cmdInfo"),
    },
    exit: {
      name: "Exit Termity",
      description: t("termity.cmdExit"),
    },
    webdbg: {
      name: "Web Debugger",
      description: t("termity.cmdWebdbg"),
      subcommands: {
        theme: t("termity.webdbgSubTheme"),
        locale: t("termity.webdbgSubLocale"),
        notify: t("termity.webdbgSubNotify"),
        mock: t("termity.webdbgSubMock"),
        inject: t("termity.webdbgSubInject"),
        storage: t("termity.webdbgSubStorage"),
        dispatch: t("termity.webdbgSubDispatch"),
        eval: t("termity.webdbgSubEval"),
        fedo: t("termity.webdbgSubFedo"),
      },
    },
    remote: {
      name: "Remote Instance",
      description: t("termity.cmdRemote"),
    },
    clear: {
      name: "Clear",
      description: t("termity.cmdClear"),
    },
  };
}

async function shellFetch(path: string): Promise<{ ok: number; data: unknown }> {
  // Platform-shell gateway: Go engine (:2048) is primary, .NET Verse.Api
  // (:2050) is the automatic fallback via fetchBackend. This replaces the
  // previous direct browser -> api.github.com calls (CORS / rate-limit safe).
  const res = await fetchBackend(path, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  // Backend uses {ok:true,data:{...}} envelope; unwrap one level when present.
  if (
    data !== null &&
    typeof data === "object" &&
    "ok" in (data as Record<string, unknown>) &&
    "data" in (data as Record<string, unknown>)
  ) {
    const env = data as { ok: boolean; data: unknown };
    if (env.ok) return { ok: res.status, data: env.data };
  }
  return { ok: res.status, data };
}

function showSubcommandHelp(
  addLine: (line: TerminalLine) => void,
  title: string,
  subcommands: Record<string, string>,
  t: (key: string) => string
) {
  addLine({ type: "output", text: `${title} - ${t("termity.subcmdList")}:` });
  Object.entries(subcommands).forEach(([cmd, desc]) => {
    addLine({ type: "output", text: `  ${cmd.padEnd(30)} │ ${desc}` });
  });
}

const WEEKDAYS_ZH = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function parseGMTOffset(gmt: string): number {
  const m = gmt.match(/^(\+|-)?(\d{1,2})(?::(\d{2}))?$/);
  if (!m) throw new Error("Invalid GMT offset");
  const sign = m[1] === "-" ? -1 : 1;
  const hours = parseInt(m[2], 10);
  const minutes = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}

function applyGMTOffset(date: Date, gmtStr: string): Date {
  const targetOffset = parseGMTOffset(gmtStr);
  const localOffset = -date.getTimezoneOffset();
  const diff = (targetOffset - localOffset) * 60 * 1000;
  return new Date(date.getTime() + diff);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const wd = WEEKDAYS_ZH[d.getDay()];
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${mo}/${da} ${wd} ${h}:${mi}:${s}`;
}

function formatISO8601(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}:${s}`;
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

export function Termity({ windowId }: { windowId?: string }) {
  const { t } = useI18n();
  const systemStore = useSystemStore();
  const instanceStore = useInstanceStore();
  const userStore = useUserStore();
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: "system", text: "Termity [v2.0.0]" },
    { type: "system", text: 'Type "help" to see available commands.' },
    { type: "system", text: "" },
  ]);
  const [input, setInput] = useState("");
  // 命令历史：持久化到 localStorage（类 bash HISTFILE），两个挂载点共享同一份
  const commandHistory = useTermityHistoryStore((s) => s.history);
  const pushCommandHistory = useTermityHistoryStore((s) => s.push);
  const MAX_HISTORY_LINES = 500;
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  // 浏览历史前正在输入的草稿：回退到最新一条时应原样还原（类 bash readline）
  const draftRef = useRef<string>("");
  // 指令预测（类 zsh-autosuggestions）：内联幽灵文本
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const moveCaretToEndRef = useRef(false);
  const suggestion = useMemo(
    () => (suggestDismissed ? null : findHistorySuggestion(commandHistory, input)),
    [commandHistory, input, suggestDismissed]
  );
  const suggestSuffix = useMemo(
    () => (suggestion ? suggestionSuffix(suggestion, input) : ""),
    [suggestion, input]
  );

  // 接受建议后把光标移到行尾
  useEffect(() => {
    if (moveCaretToEndRef.current && inputRef.current) {
      moveCaretToEndRef.current = false;
      const end = inputRef.current.value.length;
      inputRef.current.setSelectionRange(end, end);
    }
  }, [input]);

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
    setHistory((prev) => {
      const next = [...prev, line];
      return next.length > MAX_HISTORY_LINES ? next.slice(-MAX_HISTORY_LINES) : next;
    });
  }, []);

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      addLine({ type: "input", text: trimmed });

      // 立即落盘（每条命令即写，非登出时写）
      pushCommandHistory(trimmed);
      setHistoryIndex(-1);
      draftRef.current = "";

      const parts = trimmed.split(/\s+/);
      const root = parts[0].toLowerCase();
      const args = parts.slice(1);

      const COMMANDS = getCommands(t);

      switch (root) {
        case "help": {
          addLine({ type: "system", text: "┌─────────────────────────────────────────────┐" });
          addLine({ type: "system", text: "│                 Termity                     │" });
          addLine({ type: "system", text: "│              Command List                   │" });
          addLine({ type: "system", text: "├─────────────────────────────────────────────┤" });
          Object.entries(COMMANDS).forEach(([cmd, info]) => {
            addLine({
              type: "output",
              text: `  ${cmd.padEnd(12)} │ ${info.description}`,
            });
          });
          addLine({ type: "system", text: "└─────────────────────────────────────────────┘" });
          addLine({ type: "system", text: t("termity.helpHint") });
          break;
        }

        case "vnet": {
          if (args[0] === "--help" || args.length === 0 || !COMMANDS.vnet.subcommands![args[0]]) {
            showSubcommandHelp(addLine, t("termity.vnetTitle"), COMMANDS.vnet.subcommands!, t);
            break;
          }
          if (args[0] === "status") {
            const s = useSystemStore.getState();
            const online = s.isBackendOnline;
            addLine({
              type: online ? "output" : "error",
              text: `${t("termity.vnetTitle")} ${t("termity.status")}: ${online ? t("termity.connected") : t("termity.offline")} [engine :2048 ${s.isEngineOnline ? "online" : "offline"} | api :2050 ${s.isApiOnline ? "online" : "offline"}]`,
            });
            // Backend-measured EventBus detail (Go engine shell gateway).
            shellFetch("/api/shell/vnet").then(({ ok, data }) => {
              if (ok !== 200) return;
              const d = data as { eventbus_subscribers?: number; version?: string };
              addLine({
                type: "output",
                text: `  backend vnet: engine online, eventbus_subscribers=${d.eventbus_subscribers ?? "-"}, version=${d.version ?? "-"}`,
              });
            }).catch(() => {});
          } else if (args[0] === "ping") {
            addLine({ type: "system", text: t("termity.vnetPinging") });
            const started = Date.now();
            shellFetch("/api/shell/ping").then(({ ok, data }) => {
              if (ok !== 200) {
                addLine({ type: "error", text: `${t("termity.githubApiError")}: ${ok}` });
                return;
              }
              const d = data as { backend?: string; version?: string };
              addLine({ type: "output", text: `Pong! ${t("termity.latency")}: ${Date.now() - started}ms [${d.backend ?? "backend"}${d.version ? ` ${d.version}` : ""}]` });
            }).catch(() => {
              addLine({ type: "error", text: t("termity.authDevicesError") });
            });
          } else if (args[0] === "config") {
            const s = useSystemStore.getState();
            addLine({ type: "output", text: `${t("termity.networkConfig")}:` });
            addLine({ type: "output", text: `  engine :2048 (/healthz): ${s.isEngineOnline ? t("termity.online") : t("termity.offline")}` });
            addLine({ type: "output", text: `  api    :2050 (/healthz-api): ${s.isApiOnline ? t("termity.online") : t("termity.offline")}` });
            addLine({ type: "output", text: `  ${t("termity.backendAddr")}: ${typeof window !== "undefined" ? window.location.origin : "N/A"}` });
            addLine({ type: "output", text: `  ${t("termity.connStatus")}: ${s.isBackendOnline ? t("termity.online") : t("termity.offline")}` });
            shellFetch("/api/shell/meta").then(({ ok, data }) => {
              if (ok !== 200) return;
              const d = data as { backend?: string; version?: string; time?: string };
              addLine({ type: "output", text: `  shell gateway: ${d.backend ?? "-"} version=${d.version ?? "-"} time=${d.time ?? "-"}` });
            }).catch(() => {});
          }
          break;
        }

        case "func": {
          if (args[0] === "--help" || args.length === 0) {
            showSubcommandHelp(addLine, "Function Switch", COMMANDS.func.subcommands!, t);
            addLine({ type: "output", text: "" });
            addLine({ type: "output", text: `${t("termity.developAdvanced")}:` });
            addLine({ type: "output", text: `  ${"System.Develop latest commit".padEnd(35)} │ ${t("termity.devLatestCommit")}` });
            addLine({ type: "output", text: `  ${"System.Develop latest release".padEnd(35)} │ ${t("termity.devLatestRelease")}` });
            addLine({ type: "output", text: `  ${"System.Develop {ver} commit".padEnd(35)} │ ${t("termity.devVerCommit")}` });
            addLine({ type: "output", text: `  ${"System.Develop {ver} release".padEnd(35)} │ ${t("termity.devVerRelease")}` });
            break;
          }
          // —— 功能项点分式规范（Type.Name，类 .NET）——
          // 规范形：func <verb> System.X [args]；查询形：func System.Develop <query>
          // 旧写法（enable Develop / pdebug … / lang … / Develop …）为废弃别名：仍执行并提示规范形。
          const FEATURES = ["System.Develop", "System.PortalDebugger", "System.Locale"];
          let ft = [...args];
          let legacyTo: string | null = null;
          {
            const h = (ft[0] || "").toLowerCase();
            const s = (ft[1] || "").toLowerCase();
            if ((h === "enable" || h === "disable") && s === "develop") {
              ft = [ft[0], "System.Develop", ...ft.slice(2)];
              legacyTo = `func ${ft[0]} System.Develop${ft.length > 2 ? ` ${ft.slice(2).join(" ")}` : ""}`;
            } else if (h === "pdebug" && (s === "show" || s === "hide")) {
              ft = [ft[1], "System.PortalDebugger", ...ft.slice(2)];
              legacyTo = `func ${ft[0]} System.PortalDebugger`;
            } else if (h === "lang" && (s === "switch" || s === "current")) {
              ft = [ft[1], "System.Locale", ...ft.slice(2)];
              legacyTo = s === "switch" ? "func switch System.Locale {locale}" : "func current System.Locale";
            } else if (h === "develop") {
              ft = ["System.Develop", ...ft.slice(1)];
              legacyTo = `func System.Develop${ft.length > 1 ? ` ${ft.slice(1).join(" ")}` : ""}`;
            }
          }
          const verb = (ft[0] || "").toLowerCase();
          const feat = (ft[1] || "").toLowerCase();
          const nudge = () => {
            if (legacyTo) addLine({ type: "warning", text: t("termity.funcDeprecated", { canonical: legacyTo }) });
          };
          const unknownFeature = () => {
            addLine({ type: "error", text: `${t("termity.unknownCmd")}: func ${args.join(" ")}` });
            addLine({ type: "output", text: `Available features: ${FEATURES.join(", ")}` });
          };
          if (verb === "switch" || verb === "current") {
            if (feat !== "system.locale") { unknownFeature(); break; }
            if (verb === "current") {
              const current = useLocaleStore.getState().locale;
              addLine({ type: "output", text: `Current language: ${current} (${localeNames[current]})` });
            } else if (ft[2]) {
              const target = ft[2] as Locale;
              const supported = ["zh-CN", "zh-TW", "en-US", "ja-JP"];
              if (!supported.includes(target)) {
                addLine({ type: "error", text: `Unsupported locale: ${target}` });
                addLine({ type: "output", text: `Supported: ${supported.join(", ")}` });
              } else if (!userStore.isLoggedIn) {
                addLine({ type: "warning", text: t("termity.loginRequired") });
              } else {
                const prev = useLocaleStore.getState().locale;
                useLocaleStore.getState().setLocale(target);
                addLine({ type: "output", text: `Language switched: ${prev} → ${target} (${localeNames[target]})` });
              }
            } else {
              addLine({ type: "output", text: "Usage: func switch System.Locale {locale} | func current System.Locale" });
              addLine({ type: "output", text: `Supported locales: ${Object.keys(localeNames).join(", ")}` });
            }
            nudge();
          } else if (verb === "enable" || verb === "disable") {
            if (feat !== "system.develop") { unknownFeature(); break; }
            if (verb === "enable") {
              const subArgs = parseArgs(ft.slice(2).join(" "));
              if (subArgs["time"] === "meta") {
                userStore.developerEnter();
                localStorage.setItem("asagity_dev_persistent", "true");
                addLine({ type: "output", text: "> Developer Entry ENABLED (Persistent)" });
                addLine({ type: "output", text: `  ${t("termity.devEnabledPersist")}` });
              } else {
                userStore.developerEnter();
                addLine({ type: "output", text: "> Developer Entry ENABLED (Session)" });
                addLine({ type: "output", text: `  ${t("termity.devEnabledSession")}` });
              }
            } else {
              userStore.logout();
              localStorage.removeItem("asagity_dev_persistent");
              addLine({ type: "output", text: "> Developer Account LOGGED OUT" });
              addLine({ type: "output", text: `  ${t("termity.devDisabled")}` });
            }
            nudge();
          } else if (verb === "show" || verb === "hide") {
            if (feat !== "system.portaldebugger") { unknownFeature(); break; }
            if (verb === "show") {
              usePortalDebuggerStore.getState().showEntry();
              addLine({ type: "output", text: `> Portal Debugger: ${t("termity.pdebugShown")}` });
            } else {
              usePortalDebuggerStore.getState().hideEntry();
              addLine({ type: "output", text: `> Portal Debugger: ${t("termity.pdebugHidden")}` });
            }
            nudge();
          } else if (verb === "system.develop") {
            const developCmd = ft.slice(1);
            const subArgs = parseArgs(developCmd.join(" "));

            if (developCmd.length === 0) {
              addLine({ type: "output", text: t("termity.devHelpHint") });
              nudge();
              break;
            }

            const developAction = developCmd[0].toLowerCase();

            if (developAction === "latest") {
              const type = developCmd[1]?.toLowerCase();
              if (type === "commit") {
                addLine({ type: "system", text: t("termity.devFetchingMainCommit") });
                shellFetch("/api/shell/github/latest-commit?ref=main").then(({ ok, data }) => {
                  if (ok !== 200) {
                    addLine({ type: "error", text: `${t("termity.githubApiError")}: ${ok}` });
                    return;
                  }
                  const d = data as { sha: string; message: string; author: string; date: string };
                  addLine({ type: "output", text: `  SHA:      ${d.sha.slice(0, 7)}` });
                  addLine({ type: "output", text: `  Message:  ${d.message.split("\n")[0]}` });
                  addLine({ type: "output", text: `  Author:   ${d.author}` });
                  addLine({ type: "output", text: `  Date:     ${d.date}` });
                }).catch(() => {
                  addLine({ type: "error", text: t("termity.authDevicesError") });
                });
              } else if (type === "release") {
                addLine({ type: "system", text: t("termity.devFetchingMainRelease") });
                shellFetch("/api/shell/github/latest-release").then(({ ok, data }) => {
                  if (ok !== 200) {
                    addLine({ type: "error", text: `${t("termity.githubApiError")}: ${ok}` });
                    return;
                  }
                  const latest = data as { tag_name: string; name: string; body: string; published_at: string };
                  addLine({ type: "output", text: `  Version:  ${latest.tag_name}` });
                  addLine({ type: "output", text: `  Name:     ${latest.name}` });
                  addLine({ type: "output", text: `  Date:     ${latest.published_at}` });

                  if (latest.body) {
                    addLine({ type: "output", text: "  Changelog:" });
                    latest.body.split("\n").slice(0, 8).forEach((line: string) => {
                      addLine({ type: "output", text: `    ${line}` });
                    });
                  }
                });
              } else {
                addLine({ type: "output", text: t("termity.devUsageLatest") });
              }
            } else {
              const version = developAction;
              const type = developCmd[1]?.toLowerCase();
              const branch = subArgs["branch"] || "main";

              if (type === "commit") {
                addLine({ type: "system", text: `${t("termity.devFetchingBranchCommit")} ${branch} ${version}...` });
                shellFetch(`/api/shell/github/latest-commit?ref=${encodeURIComponent(version)}`).then(({ ok, data }) => {
                  if (ok !== 200) {
                    addLine({ type: "error", text: `${t("termity.githubApiError")}: ${ok}` });
                    return;
                  }
                  const d = data as { sha: string; message: string; author: string; date: string };
                  addLine({ type: "output", text: `  SHA:      ${d.sha.slice(0, 7)}` });
                  addLine({ type: "output", text: `  Message:  ${d.message.split("\n")[0]}` });
                  addLine({ type: "output", text: `  Author:   ${d.author}` });
                  addLine({ type: "output", text: `  Date:     ${d.date}` });
                }).catch(() => {
                  addLine({ type: "error", text: t("termity.authDevicesError") });
                });
              } else if (type === "release") {
                addLine({ type: "system", text: `${t("termity.devFetchingBranchRelease")} ${branch} ${version}...` });
                shellFetch(`/api/shell/github/release?tag=${encodeURIComponent(version)}`).then(({ ok, data }) => {
                  if (ok !== 200) {
                    addLine({ type: "error", text: `${t("termity.githubApiError")}: ${ok}` });
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
                addLine({ type: "output", text: t("termity.devUsageVersion") });
                addLine({ type: "output", text: "      func System.Develop {version} release branch={branch}" });
              }
            }
            nudge();
          } else if (verb === "system.portaldebugger" || verb === "system.locale") {
            // 特性前置但非查询型：指回动词优先写法
            if (verb === "system.locale") {
              addLine({ type: "output", text: "Usage: func switch System.Locale {locale} | func current System.Locale" });
            } else {
              addLine({ type: "output", text: t("termity.pdebugUsage") });
            }
          } else {
            addLine({ type: "error", text: `${t("termity.unknownCmd")}: func ${args.join(" ")}` });
            addLine({ type: "output", text: t("termity.helpHint") });
          }
          break;
        }

        case "time": {
          const gmtArg = args.find((a) => a.startsWith("--GMT="));
          const now = new Date();
          try {
            const adjusted = gmtArg ? applyGMTOffset(now, gmtArg.slice(6)) : now;
            const h = String(adjusted.getHours()).padStart(2, "0");
            const m = String(adjusted.getMinutes()).padStart(2, "0");
            const s = String(adjusted.getSeconds()).padStart(2, "0");
            const tzLabel = gmtArg ? ` (UTC${gmtArg.slice(6)})` : "";
            addLine({ type: "output", text: `${h}:${m}:${s}${tzLabel}` });
          } catch {
            addLine({ type: "error", text: t("termity.timeInvalidGMT") });
          }
          break;
        }

        case "date": {
          const gmtArg = args.find((a) => a.startsWith("--GMT="));
          const fmtArg = args.find((a) => a.startsWith("--format="));
          const now = new Date();
          try {
            const adjusted = gmtArg ? applyGMTOffset(now, gmtArg.slice(6)) : now;
            if (fmtArg) {
              const fmtVal = fmtArg.slice(9).replace(/^['"]|['"]$/g, "").toLowerCase();
              if (fmtVal === "iso" || fmtVal === "iso8601") {
                addLine({ type: "output", text: formatISO8601(adjusted) });
              } else {
                addLine({ type: "error", text: t("termity.dateInvalidFormat") });
                addLine({ type: "output", text: formatDate(adjusted) });
              }
            } else {
              addLine({ type: "output", text: formatDate(adjusted) });
            }
          } catch {
            addLine({ type: "error", text: t("termity.dateInvalidGMT") });
            addLine({ type: "output", text: formatDate(now) });
          }
          break;
        }

        case "whoami": {
          if (!userStore.isLoggedIn) {
            addLine({ type: "warning", text: t("termity.loginRequired") });
            break;
          }
          // Prefer backend source of truth; fall back to local store when offline.
          if (userStore.accessToken && userStore.accessToken !== "dev_mock_token_39") {
            fetchBackend("/api/auth/me", {
              headers: { Authorization: `Bearer ${userStore.accessToken}` },
              signal: AbortSignal.timeout(5000),
            }).then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const body = await res.json() as { ok: boolean; data: { name?: string; username?: string; pub_id?: string; pubid?: string; role?: string } };
              const u = body.data ?? {};
              addLine({ type: "output", text: `${u.name || "-"} (@${u.username || "-"})` });
              addLine({ type: "output", text: `  PubID:  ${u.pub_id || u.pubid || "-"}` });
              addLine({ type: "output", text: `  Role:   ${u.role || "user"} (backend)` });
            }).catch(() => {
              const u = userStore.user;
              addLine({ type: "output", text: `${u?.name || "-"} (@${u?.username || "-"})` });
              addLine({ type: "output", text: `  PubID:  ${u?.pubid || "-"}` });
              addLine({ type: "output", text: `  Role:   ${u?.role || "user"} (local)` });
            });
          } else {
            const u = userStore.user;
            addLine({ type: "output", text: `${u?.name || "-"} (@${u?.username || "-"})` });
            addLine({ type: "output", text: `  PubID:  ${u?.pubid || "-"}` });
            addLine({ type: "output", text: `  Role:   ${u?.role || "user"}` });
          }
          break;
        }

        case "info": {
          addLine({ type: "output", text: `${t("termity.serverInfo")}:` });
          // Backend first (/api/meta/instance + /api/meta/version), local store fallback.
          Promise.all([
            fetchBackend("/api/meta/instance", { signal: AbortSignal.timeout(5000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
            fetchBackend("/api/meta/version", { signal: AbortSignal.timeout(5000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          ]).then(([metaBody, verBody]) => {
            const meta = (metaBody as { ok: boolean; data: { name?: string; alias?: string; description?: string } } | null)?.data;
            const ver = (verBody as { ok: boolean; data: { version?: string } } | { version?: string } | null);
            const version = (ver as { data?: { version?: string }; version?: string } | null)?.data?.version
              ?? (ver as { version?: string } | null)?.version
              ?? instanceStore.version;
            addLine({ type: "output", text: `  ${t("termity.infoName")}: ${meta?.name || instanceStore.name || "Asagity"} (backend)` });
            addLine({ type: "output", text: `  ${t("termity.infoAlias")}: ${meta?.alias || instanceStore.alias || "asagity.io"}` });
            addLine({ type: "output", text: `  ${t("termity.infoVersion")}: ${version || "2.0.0"}` });
            addLine({ type: "output", text: `  ${t("termity.infoDesc")}: ${meta?.description || instanceStore.description || "Asagity"}` });
            addLine({ type: "output", text: `  ${t("termity.infoDev")}: ${userStore.isLoggedIn ? userStore.username || t("termity.loggedIn") : t("termity.notLoggedIn")}` });
          });
          break;
        }

        case "exit": {
          addLine({ type: "system", text: t("termity.closingSession") });
          // 嵌入模式（调试器右栏）没有独立 windowId：不关窗，只给提示
          if (!windowId) {
            addLine({ type: "output", text: t("termity.exitEmbeddedHint") });
            break;
          }
          addTimer(() => {
            useFreeWindowStore.getState().close(windowId);
          }, 300);
          break;
        }

        case "clear": {
          setHistory([]);
          break;
        }

        case "auth": {
          if (args[0] === "--help" || args.length === 0 || !COMMANDS.auth.subcommands![args[0]]) {
            showSubcommandHelp(addLine, "Account", COMMANDS.auth.subcommands!, t);
            break;
          }
          if (args[0] === "info") {
            if (!userStore.isLoggedIn) {
              addLine({ type: "warning", text: t("termity.loginRequired") });
              break;
            }
            fetchBackend("/api/auth/me", {
              headers: { Authorization: `Bearer ${userStore.accessToken}` },
              signal: AbortSignal.timeout(5000),
            }).then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const body = await res.json() as { ok: boolean; data: { name?: string; username?: string; pub_id?: string; avatar_url?: string; role?: string } };
              const u = body.data ?? {};
              addLine({ type: "output", text: `${t("termity.accountInfo")} (backend):` });
              addLine({ type: "output", text: `  ${t("termity.infoName")}: ${u.name || "-"}` });
              addLine({ type: "output", text: `  ${"username"}: ${u.username || "-"}` });
              addLine({ type: "output", text: `  ${"PubID"}: ${u.pub_id || "-"}` });
              addLine({ type: "output", text: `  ${"Role"}: ${u.role || "user"}` });
              addLine({ type: "output", text: `  ${"Avatar"}: ${u.avatar_url || "-"}` });
            }).catch(() => {
              const u = userStore.user;
              addLine({ type: "output", text: `${t("termity.accountInfo")} (local):` });
              addLine({ type: "output", text: `  ${t("termity.infoName")}: ${u?.name || "-"}` });
              addLine({ type: "output", text: `  ${"username"}: ${u?.username || "-"}` });
              addLine({ type: "output", text: `  ${"PubID"}: ${u?.pubid || "-"}` });
              addLine({ type: "output", text: `  ${"Role"}: ${u?.role || "user"}` });
              addLine({ type: "output", text: `  ${"Avatar"}: ${u?.avatar_url || "-"}` });
            });
          } else if (args[0] === "devices") {
            if (!userStore.isLoggedIn) {
              addLine({ type: "warning", text: t("termity.loginRequired") });
              break;
            }
            addLine({ type: "system", text: t("termity.authFetchingDevices") });
            fetchBackend("/api/auth/devices", {
              headers: { Authorization: `Bearer ${userStore.accessToken}` },
              signal: AbortSignal.timeout(8000),
            }).then(async (res) => {
              if (res.status === 404 || res.status === 501) {
                addLine({ type: "warning", text: "devices endpoint not implemented on backend yet (404/501)" });
                return;
              }
              if (!res.ok) {
                addLine({ type: "error", text: `API ${res.status}` });
                return;
              }
              const data = await res.json() as { devices?: { id: string; device_name: string; ip_address: string; last_seen_at: string; trusted_at: string | null }[] };
              const devices = data.devices || data;
              if (!Array.isArray(devices) || devices.length === 0) {
                addLine({ type: "output", text: t("termity.authNoDevices") });
                return;
              }
              addLine({ type: "output", text: `${t("termity.authDeviceList")}:` });
              devices.forEach((d) => {
                const trusted = d.trusted_at ? ` ✓` : "";
                addLine({ type: "output", text: `  ${d.device_name || d.id} (${d.ip_address})${trusted}` });
                addLine({ type: "output", text: `    ${t("termity.authLastSeen")}: ${d.last_seen_at}` });
              });
            }).catch(() => {
              addLine({ type: "error", text: t("termity.authDevicesError") });
            });
          } else if (args[0] === "tokens") {
            if (!userStore.isLoggedIn) {
              addLine({ type: "warning", text: t("termity.loginRequired") });
              break;
            }
            addLine({ type: "output", text: `${t("termity.authTokenInfo")}:` });
            addLine({ type: "output", text: `  Access Token: ${userStore.accessToken ? "••••" + userStore.accessToken.slice(-6) : "-"}` });
            addLine({ type: "output", text: `  Refresh Token: ${userStore.refreshToken ? "••••" + userStore.refreshToken.slice(-6) : "-"}` });
          } else if (args[0] === "linked") {
            if (!userStore.isLoggedIn) {
              addLine({ type: "warning", text: t("termity.loginRequired") });
              break;
            }
            addLine({ type: "output", text: t("termity.authLinkedAccounts") });
            addLine({ type: "output", text: `  ${t("termity.authLinkedNone")}` });
          } else if (args[0] === "logout") {
            if (!userStore.isLoggedIn) {
              addLine({ type: "warning", text: t("termity.loginRequired") });
              break;
            }
            if (args[1] === "all") {
              userStore.logoutAll().then(() => {
                addLine({ type: "output", text: t("termity.authLogoutAllSuccess") });
              });
            } else {
              userStore.logout().then(() => {
                addLine({ type: "output", text: t("termity.authLogoutSuccess") });
              });
            }
          }
          break;
        }

        case "remote": {
          addLine({ type: "warning", text: t("termity.remoteInDev") });
          addLine({ type: "output", text: t("termity.remoteDesc") });
          break;
        }

        case "webdbg": {
          // Web Debugger: Portal Debugger 控制台指令的 Termity 入口，
          // 隶属 Develop 功能项 —— 未启用开发者模式时不可用。
          if (!userStore.isLoggedIn) {
            addLine({ type: "warning", text: t("termity.loginRequired") });
            break;
          }
          if (!userStore.isAdmin) {
            addLine({ type: "error", text: t("termity.webdbgRequiresDevelop") });
            addLine({ type: "output", text: t("termity.webdbgEnableHint") });
            break;
          }
          if (args.length === 0 || args[0] === "--help") {
            showSubcommandHelp(addLine, "Web Debugger", COMMANDS.webdbg.subcommands!, t);
            break;
          }
          const sub = args[0].toLowerCase();
          if (!getDebugCommandNames().includes(sub)) {
            addLine({ type: "error", text: `${t("termity.unknownCmd")}: webdbg ${args[0]}` });
            showSubcommandHelp(addLine, "Web Debugger", COMMANDS.webdbg.subcommands!, t);
            break;
          }
          const { result } = executeDebugCommand(args.join(" "));
          addLine({
            type:
              result.severity === "error"
                ? "error"
                : result.severity === "warning"
                  ? "warning"
                  : "output",
            text: result.message,
          });
          break;
        }

        default: {
          addLine({ type: "error", text: `${t("termity.unknownCmd")}: ${root}` });
          addLine({ type: "output", text: t("termity.helpHint") });
        }
      }

      addLine({ type: "system", text: "" });
    },
    [addLine, systemStore, instanceStore, userStore, t, windowId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        executeCommand(input);
        setInput("");
        setHistoryIndex(-1);
        draftRef.current = "";
      } else if (e.key === "ArrowUp") {
        // ↑ 往更早的方向走；到最旧一条即停住（不循环），与 bash 一致
        e.preventDefault();
        if (commandHistory.length > 0) {
          if (historyIndex === -1) draftRef.current = input;
          const newIndex =
            historyIndex === -1
              ? commandHistory.length - 1
              : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        // ↓ 往更新的方向走；越过最新一条则回到草稿行
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setInput(draftRef.current);
          } else {
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
          }
        }
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setHistory([]);
      } else if (e.key === "Escape") {
        // zsh autosuggest-clear：忽略当前建议（再次编辑输入即恢复）
        if (suggestion) {
          e.preventDefault();
          setSuggestDismissed(true);
        }
      } else if (e.key === "ArrowRight" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        // zsh autosuggest-accept：光标在行尾时按 → 接受整条建议
        const el = e.currentTarget as HTMLInputElement;
        const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
        if (suggestion && atEnd) {
          e.preventDefault();
          setInput(suggestion);
          setSuggestDismissed(true);
          moveCaretToEndRef.current = true;
        }
      } else if ((e.key === "ArrowRight" && (e.altKey || e.ctrlKey)) || (e.key === "e" && e.ctrlKey)) {
        // zsh autosuggest-accept-word：部分接受（补齐下一个词）
        if (suggestion) {
          e.preventDefault();
          setInput(acceptWord(suggestion, input));
          setSuggestDismissed(true);
          moveCaretToEndRef.current = true;
        }
      } else if (e.key === "End" && suggestion) {
        // zsh 默认绑定：end-of-line 接受建议
        e.preventDefault();
        setInput(suggestion);
        setSuggestDismissed(true);
        moveCaretToEndRef.current = true;
      } else if (e.key === "Tab" && suggestion) {
        // 作用域内接管 Tab（仅 Termity 输入框且存在建议时）；
        // 无建议时不拦截，保留浏览器默认的焦点移动（无障碍要求）。
        e.preventDefault();
        setInput(suggestion);
        setSuggestDismissed(true);
        moveCaretToEndRef.current = true;
      }
    },
    [input, executeCommand, commandHistory, historyIndex, suggestion]
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
          <div className="relative flex-1 min-w-0 ml-2">
            {/* 指令预测幽灵文本层：与输入框同字体度量，仅显示未输入的后缀 */}
            {suggestSuffix && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre select-none"
                aria-hidden="true"
              >
                <span className="invisible">{input}</span>
                <span className="text-gray-600">{suggestSuffix}</span>
              </div>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setSuggestDismissed(false);
              }}
              onKeyDown={handleKeyDown}
              type="text"
              className="relative w-full bg-transparent border-none outline-none text-white caret-green-500"
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>
      </div>

      <style>{`
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
