"use client";

import { useEffect, useRef, useCallback } from "react";

export interface RuntimeError {
  id: string;
  type: "js-error" | "unhandled-rejection" | "console-error" | "render-error";
  severity: "error" | "warning";
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  componentStack?: string;
}

let errorIdCounter = 0;
function generateErrorId(): string {
  errorIdCounter += 1;
  return `re-${Date.now()}-${errorIdCounter}`;
}

function parseStackFrame(stack?: string): { filename?: string; lineno?: number; colno?: number } | null {
  if (!stack) return null;
  // 匹配最常见的 stack frame 格式: at functionName (filename:line:col) 或 at filename:line:col
  const match = stack.match(/at\s+(?:.*?\s+\()?(.+?):(\d+):(\d+)\)?/);
  if (match) {
    return { filename: match[1], lineno: parseInt(match[2], 10), colno: parseInt(match[3], 10) };
  }
  return null;
}

function isErrorDuplicated(prev: RuntimeError[], next: RuntimeError): boolean {
  // 5 秒内相同 message + 相同 filename 视为重复
  const FIVE_SECONDS = 5000;
  return prev.some(
    (e) =>
      e.message === next.message &&
      e.filename === next.filename &&
      e.type === next.type &&
      next.timestamp - e.timestamp < FIVE_SECONDS
  );
}

interface UseRuntimeErrorsOptions {
  onError?: (error: RuntimeError) => void;
  maxErrors?: number;
}

export function useRuntimeErrors(options: UseRuntimeErrorsOptions = {}) {
  const { onError, maxErrors = 100 } = options;
  const errorsRef = useRef<RuntimeError[]>([]);
  const listenersRef = useRef<{
    onError?: (e: ErrorEvent) => void;
    onRejection?: (e: PromiseRejectionEvent) => void;
    onConsoleError?: (...args: unknown[]) => void;
  }>({});

  const addError = useCallback(
    (error: RuntimeError) => {
      if (isErrorDuplicated(errorsRef.current, error)) return;
      errorsRef.current = [error, ...errorsRef.current].slice(0, maxErrors);
      onError?.(error);
    },
    [onError, maxErrors]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. window.onerror — 捕获未处理的 JS 运行时错误
    const handleOnError = (event: ErrorEvent) => {
      event.preventDefault();
      const frame = parseStackFrame(event.error?.stack);
      addError({
        id: generateErrorId(),
        type: "js-error",
        severity: "error",
        message: event.message || String(event.error),
        stack: event.error?.stack,
        filename: event.filename || frame?.filename,
        lineno: event.lineno || frame?.lineno,
        colno: event.colno || frame?.colno,
        timestamp: Date.now(),
      });
    };

    // 2. unhandledrejection — 捕获未处理的 Promise 拒绝
    const handleOnRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      const frame = parseStackFrame(stack);
      addError({
        id: generateErrorId(),
        type: "unhandled-rejection",
        severity: "error",
        message,
        stack,
        filename: frame?.filename,
        lineno: frame?.lineno,
        colno: frame?.colno,
        timestamp: Date.now(),
      });
    };

    // 3. 劫持 console.error — 捕获 React 组件渲染错误和开发警告
    const origConsoleError = console.error;
    const handleConsoleError = (...args: unknown[]) => {
      // React 的 console.error 第一个参数通常是 Error 对象或字符串
      const firstArg = args[0];
      let message: string;
      let stack: string | undefined;
      let componentStack: string | undefined;

      if (firstArg instanceof Error) {
        message = firstArg.message;
        stack = firstArg.stack;
      } else if (typeof firstArg === "string") {
        message = firstArg;
      } else {
        message = String(firstArg);
      }

      // 检查是否为 React 组件栈信息
      const stackArg = args.find((a) => typeof a === "string" && a.includes("\n    at ")) as string | undefined;
      if (stackArg) {
        componentStack = stackArg;
      }

      // 判断严重度：React 的 warning 通常以 "Warning:" 开头
      const isWarning = message.startsWith("Warning:") || message.startsWith("[HMR]");

      if (!isWarning) {
        addError({
          id: generateErrorId(),
          type: "console-error",
          severity: "error",
          message,
          stack,
          componentStack,
          timestamp: Date.now(),
        });
      }

      // 保留原始行为
      origConsoleError.apply(console, args);
    };

    listenersRef.current = { onError: handleOnError, onRejection: handleOnRejection, onConsoleError: handleConsoleError };

    window.addEventListener("error", handleOnError);
    window.addEventListener("unhandledrejection", handleOnRejection);
    console.error = handleConsoleError;

    return () => {
      window.removeEventListener("error", handleOnError);
      window.removeEventListener("unhandledrejection", handleOnRejection);
      console.error = origConsoleError;
    };
  }, [addError]);

  return {
    getErrors: () => errorsRef.current,
    clearErrors: () => {
      errorsRef.current = [];
    },
  };
}
