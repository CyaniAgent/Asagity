"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, ja, zhCN, zhTW } from "date-fns/locale";
import { useNotificationStore, type NotificationType } from "@/stores/notifications";
import { useLocaleStore, type Locale } from "@/stores/locale";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const DATE_LOCALES: Record<Locale, typeof zhCN> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "en-US": enUS,
  "ja-JP": ja,
};

/** 通知类型 → 图标 + 点缀色（仅用 iconMap 已有图标） */
const TYPE_STYLE: Record<NotificationType, { icon: string; tint: string }> = {
  mention: { icon: "chat", tint: "text-cyan-500 bg-cyan-500/10" },
  reblog: { icon: "repeat", tint: "text-green-500 bg-green-500/10" },
  quote: { icon: "comment", tint: "text-indigo-500 bg-indigo-500/10" },
  reaction: { icon: "star", tint: "text-amber-500 bg-amber-500/10" },
  follow: { icon: "person_add", tint: "text-blue-500 bg-blue-500/10" },
  poll: { icon: "chart_multiple_16_filled", tint: "text-purple-500 bg-purple-500/10" },
  tip: { icon: "military_tech", tint: "text-orange-500 bg-orange-500/10" },
  system: { icon: "info", tint: "text-gray-500 bg-gray-500/10" },
};

/**
 * 通知中心：铃铛 + 未读 badge + 下拉面板。
 * 面板行为可扫读：类型图标 / 正文摘要 / 相对时间 / 未读点，
 * 点击单条标记已读，头部一键全部已读。
 */
export function NotificationCenter() {
  const { t } = useI18n();
  const locale = useLocaleStore((s) => s.locale);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open ]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative size-9 grid place-items-center shrink-0 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        title={t("tabs.notifications")}
      >
        <Icon name="notifications" fontSize={20} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[100] w-96 max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-[fadeInUp_0.15s_ease-out]">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {t("tabs.notifications")}
              {unread > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {unread}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {t("notificationCenter.markAllRead")}
              </button>
            )}
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400 dark:text-gray-500">
                <Icon name="notifications" fontSize={32} />
                <span className="text-xs">{t("notificationCenter.empty")}</span>
              </div>
            ) : (
              notifications.map((n) => {
                const style = TYPE_STYLE[n.type];
                const title = n.user?.name ?? n.type;
                const body = n.post?.content ?? n.content ?? "";
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full flex items-start gap-3 px-2.5 py-2.5 rounded-xl text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                      n.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <span className={`size-9 grid place-items-center rounded-full shrink-0 ${style.tint}`}>
                      <Icon name={style.icon} fontSize={18} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                        {title}
                      </span>
                      {body !== "" && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                          {body}
                        </span>
                      )}
                      <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                        {formatDistanceToNowStrict(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: DATE_LOCALES[locale],
                        })}
                      </span>
                    </span>
                    {!n.isRead && (
                      <span className="size-2 rounded-full bg-cyan-500 shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
