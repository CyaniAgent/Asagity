"use client";

import { memo } from "react";
import { PortalDebuggerButton } from "./PortalDebuggerButton";
import { PortalDebuggerPanel } from "./PortalDebuggerPanel";
import { usePortalDebuggerStore } from "@/stores/portalDebugger";

export const PortalDebugger = memo(function PortalDebugger() {
  const isEntryVisible = usePortalDebuggerStore((s) => s.isEntryVisible);

  if (!isEntryVisible) return null;

  return (
    <>
      <PortalDebuggerButton />
      <PortalDebuggerPanel />
    </>
  );
});
