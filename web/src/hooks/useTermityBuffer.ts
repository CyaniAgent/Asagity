"use client";

import { useCallback, useState } from "react";
import type { TerminalLine } from "@/types/termity";
import {
  useTermitySessionsStore,
  createTermityBanner,
  MAX_TERMITY_SESSION_LINES,
} from "@/stores/termitySessions";

/**
 * Termity 缓冲抽象：输出行 / 输入行 / 历史游标 / 草稿。
 *
 * 两种后端：
 * - **会话模式**（传 sessionId）：状态存于 `termitySessions` store，
 *   独立窗口的每个 Session 各自隔离。
 * - **本地模式**（不传 sessionId）：组件内 useState，
 *   用于尚未接入 Session 的场景（如调试器内嵌 Termity）。
 */
export interface TermityBuffer {
  lines: TerminalLine[];
  input: string;
  historyIndex: number;
  draft: string;
  setLines: (updater: (prev: TerminalLine[]) => TerminalLine[]) => void;
  setInput: (value: string) => void;
  setHistoryIndex: (value: number) => void;
  setDraft: (value: string) => void;
}

/** 本地模式：状态留在组件内 */
function useLocalBuffer(): TermityBuffer {
  const [lines, setLinesState] = useState<TerminalLine[]>(() => createTermityBanner());
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState("");

  const setLines = useCallback(
    (updater: (prev: TerminalLine[]) => TerminalLine[]) => {
      setLinesState((prev) => {
        const next = updater(prev);
        return next.length > MAX_TERMITY_SESSION_LINES
          ? next.slice(-MAX_TERMITY_SESSION_LINES)
          : next;
      });
    },
    []
  );

  return { lines, input, historyIndex, draft, setLines, setInput, setHistoryIndex, setDraft };
}

/** 会话模式：状态存于 termitySessions store */
function useSessionBuffer(sessionId: string | undefined): TermityBuffer {
  const session = useTermitySessionsStore((s) =>
    sessionId ? s.sessions[sessionId] : undefined
  );
  const storeSetLines = useTermitySessionsStore((s) => s.setLines);
  const storeSetInput = useTermitySessionsStore((s) => s.setInput);
  const storeSetHistoryIndex = useTermitySessionsStore((s) => s.setHistoryIndex);
  const storeSetDraft = useTermitySessionsStore((s) => s.setDraft);

  const setLines = useCallback(
    (updater: (prev: TerminalLine[]) => TerminalLine[]) => {
      if (!sessionId) return;
      storeSetLines(sessionId, (prev) => {
        const next = updater(prev);
        return next.length > MAX_TERMITY_SESSION_LINES
          ? next.slice(-MAX_TERMITY_SESSION_LINES)
          : next;
      });
    },
    [sessionId, storeSetLines]
  );

  const setInput = useCallback(
    (value: string) => {
      if (sessionId) storeSetInput(sessionId, value);
    },
    [sessionId, storeSetInput]
  );

  const setHistoryIndex = useCallback(
    (value: number) => {
      if (sessionId) storeSetHistoryIndex(sessionId, value);
    },
    [sessionId, storeSetHistoryIndex]
  );

  const setDraft = useCallback(
    (value: string) => {
      if (sessionId) storeSetDraft(sessionId, value);
    },
    [sessionId, storeSetDraft]
  );

  return {
    lines: session?.lines ?? [],
    input: session?.input ?? "",
    historyIndex: session?.historyIndex ?? -1,
    draft: session?.draft ?? "",
    setLines,
    setInput,
    setHistoryIndex,
    setDraft,
  };
}

export function useTermityBuffer(sessionId?: string): TermityBuffer {
  const local = useLocalBuffer();
  const session = useSessionBuffer(sessionId);
  return sessionId ? session : local;
}
