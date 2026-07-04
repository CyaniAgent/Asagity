"use client";

import dynamic from "next/dynamic";
import { I18nProvider } from "@/components/providers/I18nProvider";

const WindowManager = dynamic(
  () => import("@/components/windows/WindowManager").then((m) => m.WindowManager),
  { ssr: false }
);

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <WindowManager />
    </I18nProvider>
  );
}
