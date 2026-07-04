"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PanelManagePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/panel/users");
  }, [router]);
  return null;
}
