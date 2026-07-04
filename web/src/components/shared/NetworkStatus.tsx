"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSystemStore } from "@/stores/system";
import { useUserStore } from "@/stores/user";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export function NetworkStatus() {
  const pathname = usePathname();
  const { isBackendOnline, hasLaunched, isDevMode } = useSystemStore();
  const { isLoggedIn } = useUserStore();
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useI18n();

  const isWelcomePage = pathname === "/" && !isLoggedIn;
  const isOffline = !isBackendOnline && hasLaunched && !isDevMode;

  const handleToastClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (clickTimer) clearTimeout(clickTimer);
    if (newCount >= 10) {
      setClickCount(0);
      useFreeWindowStore.getState().openTermity();
    } else {
      const timer = setTimeout(() => setClickCount(0), 1000);
      setClickTimer(timer);
    }
  }, [clickCount, clickTimer]);

  if (!isOffline) return null;

  return (
    <div className={`fixed z-[100002] pointer-events-none w-full flex justify-center transition-all duration-500 ease-out ${isWelcomePage ? "top-10" : "bottom-10"}`}>
      <div
        className="bg-black/90 backdrop-blur-xl border-2 border-red-500/80 rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-start gap-4 mx-4 max-w-xl pointer-events-auto select-none"
        onClick={handleToastClick}
      >
        <span className="text-red-500 shrink-0 mt-0.5 animate-pulse">
          <Icon name="wifi_off" fontSize={32} />
        </span>
        <div className="flex flex-col gap-1.5 pt-0.5">
          <span className="font-medium text-red-100 text-sm drop-shadow-sm">
            {isWelcomePage
              ? t("network.connectionFailedWithLogin")
              : t("network.connectionFailed")}
          </span>
          {isWelcomePage && (
            <span className="text-xs text-red-400 font-normal leading-relaxed">
              {t("network.contactAdmin")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
