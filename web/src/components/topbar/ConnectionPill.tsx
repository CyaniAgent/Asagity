"use client";

import { useSystemStore } from "@/stores/system";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/** 连接状态药丸（搬运自旧 MainLayout，样式保持玻璃药丸） */
export function ConnectionPill() {
  const { t } = useI18n();
  const isBackendOnline = useSystemStore((s) => s.isBackendOnline);
  const isDevMode = useSystemStore((s) => s.isDevMode);

  return (
    <div
      className="flex items-center gap-2 px-2 h-8 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-sm cursor-help"
      title={isBackendOnline ? t("header.serverConnected") : t("header.serverDisconnected")}
    >
      <span className={isBackendOnline ? "text-green-400" : "text-red-400 animate-pulse"}>
        <Icon name={isBackendOnline ? "signal_cellular_alt" : "wifi_off"} fontSize={16} />
      </span>
      {isDevMode && (
        <>
          <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-0.5" />
          <Icon name="terminal" className="text-cyan-500" fontSize={14} />
          <span className="text-[10px] font-normal text-cyan-500">{t("header.inDevelopment")}</span>
        </>
      )}
    </div>
  );
}
