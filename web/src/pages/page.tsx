"use client";

import { lazy } from "react";
import { useUserStore } from "@/stores/user";

const DashboardLayout = lazy(() => import("@/components/layout/DashboardLayout").then((m) => ({ default: m.DashboardLayout })));
const Welcome = lazy(() => import("@/components/welcome/Welcome").then((m) => ({ default: m.Welcome })));

export default function HomePage() {
  const { isLoggedIn } = useUserStore();

  if (!isLoggedIn) {
    // cover + 焦点保主体：雪山峰/冰川带居中左、标题焊在左下，
    // 焦点偏左下，宽屏裁掉多余天空、保住底部文字。
    return <Welcome backgroundFocalPoint={{ x: 35, y: 85 }} />;
  }

  return <DashboardLayout />;
}
