"use client";

import dynamic from "next/dynamic";
import { useUserStore } from "@/stores/user";

const MainLayout = dynamic(
  () => import("@/components/layout/MainLayout").then((m) => m.MainLayout),
  { ssr: false }
);

const TimelineFeed = dynamic(
  () => import("@/components/post/TimelineFeed").then((m) => m.TimelineFeed),
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

  return (
    <MainLayout>
      <TimelineFeed />
    </MainLayout>
  );
}
