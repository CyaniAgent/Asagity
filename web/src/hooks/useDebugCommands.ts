"use client";

import { useCallback, useRef } from "react";
import { useLocaleStore, type Locale } from "@/stores/locale";
import { useThemeStore, type ColorMode } from "@/stores/theme";
import { useNotificationStore } from "@/stores/notifications";

export interface DebugCommandResult {
  message: string;
  severity: "info" | "success" | "warning" | "error";
}

export interface DebugCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => DebugCommandResult;
}

let logIdCounter = 0;

function generateLogId(): string {
  logIdCounter += 1;
  return `dbg-${Date.now()}-${logIdCounter}`;
}

/* ── 内置命令注册 ─────────────────────────────────────────── */

function buildBuiltinCommands(): DebugCommand[] {
  return [
    {
      name: "theme",
      description: "Switch between light, dark, and system theme",
      usage: "theme <dark|light|system>",
      execute: (args) => {
        const target = args[0]?.toLowerCase();
        if (!target || !["dark", "light", "system"].includes(target)) {
          return { message: "Usage: theme <dark|light|system>", severity: "warning" };
        }
        useThemeStore.getState().setPreference(target as ColorMode);
        return { message: `Theme switched to "${target}"`, severity: "success" };
      },
    },
    {
      name: "locale",
      description: "Switch the UI display language",
      usage: "locale <zh-CN|zh-TW|en-US|ja-JP>",
      execute: (args) => {
        const locale = args[0];
        const valid: Locale[] = ["zh-CN", "zh-TW", "en-US", "ja-JP"];
        if (!locale || !valid.includes(locale as Locale)) {
          return { message: `Usage: locale <${valid.join("|")}>`, severity: "warning" };
        }
        useLocaleStore.getState().setLocale(locale as Locale);
        return { message: `Language switched to "${locale}"`, severity: "success" };
      },
    },
    {
      name: "notify",
      description: "Push a system notification to the notification store",
      usage: "notify <message>",
      execute: (args) => {
        const message = args.join(" ");
        if (!message) {
          return { message: "Usage: notify <message>", severity: "warning" };
        }
        useNotificationStore.getState().addNotification({
          type: "system",
          user: { id: "pdebug", name: "Portal Debugger", username: "pdebug", avatar: "" },
          post: { id: `pdebug-${Date.now()}`, content: message },
        });
        return { message: `Notification pushed: "${message}"`, severity: "success" };
      },
    },
    {
      name: "mock",
      description: "Mock an API endpoint response",
      usage: "mock <endpoint> [statusCode] [body]",
      execute: (args) => {
        const endpoint = args[0];
        if (!endpoint) {
          return { message: "Usage: mock <endpoint> [statusCode] [body]", severity: "warning" };
        }
        const status = parseInt(args[1] || "200", 10);
        const body = args.slice(2).join(" ") || "{}";
        window.dispatchEvent(
          new CustomEvent("pdebug:mock", { detail: { endpoint, status, body } })
        );
        return { message: `Mock registered: ${endpoint} → ${status}`, severity: "success" };
      },
    },
    {
      name: "inject",
      description: "Inject a value into a Zustand store",
      usage: "inject <storeKey> <path> <value>",
      execute: (args) => {
        if (args.length < 3) {
          return { message: "Usage: inject <storeKey> <path> <value>", severity: "warning" };
        }
        window.dispatchEvent(
          new CustomEvent("pdebug:inject", {
            detail: { storeKey: args[0], path: args[1], value: args.slice(2).join(" ") },
          })
        );
        return { message: `Inject dispatched: ${args[0]}.${args[1]}`, severity: "success" };
      },
    },
    {
      name: "storage",
      description: "Read or clear localStorage / sessionStorage",
      usage: "storage <get|clear> [key]",
      execute: (args) => {
        const action = args[0]?.toLowerCase();
        if (action === "get") {
          const key = args[1];
          if (!key) return { message: "Usage: storage get <key>", severity: "warning" };
          const val = localStorage.getItem(key);
          return { message: `localStorage["${key}"] = ${val ?? "(not found)"}`, severity: "info" };
        }
        if (action === "clear") {
          localStorage.clear();
          sessionStorage.clear();
          return { message: "All storage cleared", severity: "success" };
        }
        return { message: "Usage: storage <get|clear> [key]", severity: "warning" };
      },
    },
    {
      name: "dispatch",
      description: "Dispatch a custom DOM event",
      usage: "dispatch <eventName> [detail]",
      execute: (args) => {
        const eventName = args[0];
        if (!eventName) {
          return { message: "Usage: dispatch <eventName> [detail]", severity: "warning" };
        }
        const detail = args.slice(1).join(" ") || undefined;
        window.dispatchEvent(new CustomEvent(eventName, detail ? { detail } : undefined));
        return { message: `Event "${eventName}" dispatched`, severity: "success" };
      },
    },
    {
      name: "eval",
      description: "Evaluate a JavaScript expression in the page context",
      usage: "eval <expression>",
      execute: (args) => {
        const expr = args.join(" ");
        if (!expr) {
          return { message: "Usage: eval <expression>", severity: "warning" };
        }
        try {
          // eslint-disable-next-line no-eval
          const result = (0, eval)(expr);
          return { message: String(result), severity: "success" };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return { message: `Error: ${msg}`, severity: "error" };
        }
      },
    },
  ];
}

/* ── Hook ──────────────────────────────────────────────────── */

export interface UseDebugCommandsReturn {
  commands: DebugCommand[];
  executeCommand: (input: string) => { logId: string; result: DebugCommandResult };
  getCommandNames: () => string[];
}

export function useDebugCommands(): UseDebugCommandsReturn {
  const commandsRef = useRef<DebugCommand[]>(buildBuiltinCommands());

  const executeCommand = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        logId: generateLogId(),
        result: { message: "Empty command", severity: "warning" },
      };
    }

    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cmd = commandsRef.current.find((c) => c.name === cmdName);
    if (!cmd) {
      return {
        logId: generateLogId(),
        result: { message: `Unknown command: "${cmdName}". Type "help" for available commands.`, severity: "error" },
      };
    }

    return {
      logId: generateLogId(),
      result: cmd.execute(args),
    };
  }, []);

  const getCommandNames = useCallback(() => {
    return commandsRef.current.map((c) => c.name);
  }, []);

  return {
    commands: commandsRef.current,
    executeCommand,
    getCommandNames,
  };
}
