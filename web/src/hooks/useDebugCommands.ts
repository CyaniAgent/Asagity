"use client";

import { useCallback, useRef } from "react";
import {
  getDebugCommands,
  executeDebugCommand,
  getDebugCommandNames,
  type DebugCommand,
  type DebugCommandResult,
} from "@/lib/debugCommands";

export type { DebugCommand, DebugCommandResult };

/* ── Hook ──────────────────────────────────────────────────── */

export interface UseDebugCommandsReturn {
  commands: DebugCommand[];
  executeCommand: (input: string) => { logId: string; result: DebugCommandResult };
  getCommandNames: () => string[];
}

export function useDebugCommands(): UseDebugCommandsReturn {
  const commandsRef = useRef<DebugCommand[]>(getDebugCommands());

  const executeCommand = useCallback(
    (input: string): { logId: string; result: DebugCommandResult } =>
      executeDebugCommand(input),
    []
  );

  const getCommandNames = useCallback((): string[] => getDebugCommandNames(), []);

  return {
    commands: commandsRef.current,
    executeCommand,
    getCommandNames,
  };
}
