"use client";

import type { ViewType } from "@/types/windows";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface WindowHeaderProps {
  mode: "split" | "free";
  type?: ViewType | null;
  customTitle?: string;
  customIcon?: string;
  isMaximized?: boolean;
  isMinimized?: boolean;
  disableTransfer?: boolean;
  disableMaximize?: boolean;
  disableMinimize?: boolean;
  onClose?: () => void;
  onToggleMaximize?: () => void;
  onToggleMinimize?: () => void;
  onRefresh?: () => void;
  onSwitchMode?: () => void;
}

function getIcon(type: ViewType | null | undefined, customIcon?: string) {
  if (customIcon) return customIcon;
  switch (type) {
    case "post": return "article";
    case "user": return "person";
    case "music": return "music_note";
    case "notifications": return "notifications";
    case "chat": return "forum";
    case "termity": return "terminal";
    case "admin_database": return "database";
    case "browser": return "language";
    case "error": return "error";
    case "lyrics_window": return "lyrics";
    case "playlist_window": return "queue_music";
    case "auth": return "lock";
    case "welcome_timeline": return "public";
    case "welcome_federation": return "globe";
    case "welcome_dashboard": return "dashboard";
    default: return "tab_move";
  }
}

function getTitle(type: ViewType | null | undefined, mode: string, customTitle?: string, t?: (key: string) => string) {
  if (customTitle) return customTitle;
  const t_ = t ?? ((key: string) => key);
  switch (type) {
    case "post": return t_("window.postDetail");
    case "user": return t_("window.userProfile");
    case "music": return t_("window.musicPlayer");
    case "notifications": return t_("window.notifications");
    case "chat": return t_("window.chat");
    case "termity": return t_("window.termity");
    case "admin_database": return t_("window.databaseDetails");
    case "browser": return t_("window.browser");
    case "error": return t_("window.systemError");
    case "lyrics_window": return t_("window.lyricsWindow");
    case "playlist_window": return t_("window.playlist");
    case "auth": return t_("window.authWindow");
    case "welcome_timeline": return t_("window.timelineWindow");
    case "welcome_federation": return t_("window.federationWindow");
    case "welcome_dashboard": return t_("window.dashboardWindow");
    default: return mode === "split" ? t_("window.splitView") : t_("window.freeWindow");
  }
}

export function WindowHeader({
  mode,
  type,
  customTitle,
  customIcon,
  isMaximized,
  disableTransfer,
  disableMaximize,
  disableMinimize,
  onClose,
  onToggleMaximize,
  onToggleMinimize,
  onRefresh,
  onSwitchMode,
}: WindowHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="px-3 py-1.5 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 shrink-0 cursor-grab active:cursor-grabbing rounded-t-[30px] select-none">
      <div className="flex items-center gap-2 overflow-hidden max-w-[50%]">
        <Icon name={getIcon(type, customIcon)} className="text-cyan-600 dark:text-cyan-400 shrink-0" fontSize={16} />
        <span className="text-[13px] font-normal text-gray-800 dark:text-white truncate tracking-wide">
          {getTitle(type, mode, customTitle, t)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Refresh */}
        {!disableTransfer && (
          <button
            onClick={onRefresh}
            className="rounded-full text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-white/10 p-1.5 transition-colors"
            title={t("common.refresh")}
          >
            <Icon name="refresh" fontSize={14} />
          </button>
        )}

        {/* Switch Mode (split ↔ free) */}
        {!disableTransfer && (
          <button
            onClick={onSwitchMode}
            className="rounded-full text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/10 p-1.5 transition-colors"
            title={mode === "split" ? t("window.openInFreeWindow") : t("window.openAsTab")}
          >
            <Icon name={mode === "split" ? "open_in_new" : "window_arrow_up"} fontSize={14} />
          </button>
        )}

        {/* Minimize (free only) */}
        {mode === "free" && !disableMinimize && (
          <button
            onClick={onToggleMinimize}
            className="rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 p-1.5 transition-colors"
            title={t("common.minimize")}
          >
            <Icon name="minimize" fontSize={14} />
          </button>
        )}

        {/* Maximize (free only) */}
        {mode === "free" && !disableMaximize && (
          <button
            onClick={onToggleMaximize}
            className="rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 p-1.5 transition-colors"
            title={isMaximized ? t("common.restore") : t("common.maximize")}
          >
            <Icon name="maximize" fontSize={14} />
          </button>
        )}

        <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

        {/* Close */}
        <button
          onClick={onClose}
          className="rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-colors p-1.5"
          title={t("common.close")}
        >
          <Icon name="close" fontSize={14} />
        </button>
      </div>
    </div>
  );
}
