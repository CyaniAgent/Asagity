"use client";

import { memo, useEffect } from "react";
import { PortalDebuggerButton } from "./PortalDebuggerButton";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useRuntimeErrors } from "@/hooks/useRuntimeErrors";

/**
 * PortalDebugger — 全局挂载点
 * 负责：入口按钮显隐 + 后台常驻的运行时错误收集。
 * 实际面板由 WindowManager 以自由窗口形态渲染（viewType: portal_debugger）。
 */
export const PortalDebugger = memo(function PortalDebugger() {
  const isEntryVisible = usePortalDebuggerStore((s) => s.isEntryVisible);
  const addRuntimeError = usePortalDebuggerStore((s) => s.addRuntimeError);

  // 后台常驻收集，即使自由窗口关闭也不丢失错误
  useRuntimeErrors({ onError: addRuntimeError });

  // 入口隐藏时自动关闭已打开的自由窗口，避免孤儿窗口
  useEffect(() => {
    if (!isEntryVisible) {
      const { windows, close } = useFreeWindowStore.getState();
      windows
        .filter((w) => w.viewType === "portal_debugger")
        .forEach((w) => close(w.id));
    }
  }, [isEntryVisible]);

  if (!isEntryVisible) return null;

  return <PortalDebuggerButton />;
});
