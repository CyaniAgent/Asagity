"use client";

import dynamic from "next/dynamic";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeInit } from "@/components/providers/ThemeInit";
import { TermityAuthModal } from "@/components/termity/TermityAuthModal";
import { PortalDebugger } from "@/components/portal-debugger/PortalDebugger";

const WindowManager = dynamic(
  () => import("@/components/windows/WindowManager").then((m) => m.WindowManager),
  { ssr: false }
);

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeInit />
      <I18nProvider>
        {children}
        <WindowManager />
        <TermityAuthModal />
        <PortalDebugger />
      </I18nProvider>
    </>
  );
}
