"use client";

import dynamic from "next/dynamic";

const MainLayout = dynamic(
  () => import("@/components/layout/MainLayout").then((m) => m.MainLayout),
  { ssr: false }
);

export default function AlbumsLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
