"use client";

import { memo } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";
import { useFreeWindowStore } from "@/stores/freeWindow";

export const PortalDebuggerButton = memo(function PortalDebuggerButton() {
  const isEntryVisible = usePortalDebuggerStore((s) => s.isEntryVisible);
  const windows = useFreeWindowStore((s) => s.windows);
  const openFromContext = useFreeWindowStore((s) => s.openFromContext);

  if (!isEntryVisible) return null;

  const isActive = windows.some((w) => w.viewType === "portal_debugger");

  const handleClick = () => {
    openFromContext("portal_debugger");
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-5 left-5 z-[9998]
        flex items-center justify-center
        w-11 h-11 rounded-full
        transition-all duration-200 ease-out
        ${
          isActive
            ? "bg-cyan-500 text-white shadow-[0_0_16px_rgba(57,197,187,0.5)]"
            : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_24px_rgba(57,197,187,0.3)] hover:border-cyan-500/30 dark:hover:border-cyan-500/30"
        }
        active:scale-95
      `}
      title="Portal Debugger"
    >
      <Icon
        name="terminal"
        fontSize={20}
        className={isActive ? "text-white" : ""}
      />
    </button>
  );
});
