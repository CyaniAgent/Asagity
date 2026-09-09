"use client";

import dynamic from "next/dynamic";
import { useUserStore } from "@/stores/user";

const DashboardLayout = dynamic(
  () => import("@/components/layout/DashboardLayout").then((m) => m.DashboardLayout),
  { ssr: false }
);

const Welcome = dynamic(
  () => import("@/components/welcome/Welcome").then((m) => m.Welcome),
  { ssr: false }
);

export default function HomePage() {
  const { isLoggedIn } = useUserStore();

  if (!isLoggedIn) {
    return <Welcome />;
  }

  return <DashboardLayout />;
}
