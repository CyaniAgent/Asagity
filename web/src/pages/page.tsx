"use client";

import { lazy } from "react";
import { useUserStore } from "@/stores/user";

const DashboardLayout = lazy(() => import("@/components/layout/DashboardLayout").then((m) => ({ default: m.DashboardLayout })));
const Welcome = lazy(() => import("@/components/welcome/Welcome").then((m) => ({ default: m.Welcome })));

export default function HomePage() {
  const { isLoggedIn } = useUserStore();

  if (!isLoggedIn) {
    return <Welcome />;
  }

  return <DashboardLayout />;
}
