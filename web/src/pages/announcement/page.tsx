"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { MfmRenderer } from "@/components/post/MfmRenderer";
import { useI18n } from "@/components/providers/I18nProvider";

interface Announcement {
  id: string;
  title: string;
  text: string;
  icon: "info" | "warning" | "error" | "success";
  imageUrl?: string;
  forYou?: boolean;
  isRead: boolean;
  needConfirmationToRead?: boolean;
  createdAt: string;
  updatedAt?: string;
}

const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Asagity v2.0 发布公告",
    text: "**✨ Asagity v2.0 正式发布！**\n\n本次更新包含以下重要特性：\n\n$[color=#39C5BB **MFM 渲染引擎升级**] — 支持更多文本特效\n$[color=#FF6B9D **全新文本标记语言**] — 更丰富的排版能力\n\n**新功能一览：**\n- 多维码 (QR Code) 支持\n- Skyline 云盘优化\n- 性能提升 40%\n\n详细更新日志请查看 #更新日志 话题。",
    icon: "success",
    forYou: true,
    isRead: false,
    createdAt: "2026-07-03T10:00:00Z",
  },
  {
    id: "2",
    title: "服务器维护通知",
    text: "**⚠️ 计划维护通知**\n\n$[color=#FFA500 **维护时间：**] 2026年7月5日 02:00 - 06:00 (UTC+8)\n\n维护期间以下功能将暂时不可用：\n- 用户登录/注册\n- 时间线刷新\n- 消息发送\n\n维护完成后将立即恢复服务，感谢您的理解与支持。",
    icon: "warning",
    isRead: false,
    createdAt: "2026-07-02T14:30:00Z",
  },
  {
    id: "3",
    title: "新功能预告：多维码",
    text: "大家好！\n\n我们很高兴地宣布 **多维码 (QR Code)** 功能即将上线！\n\n**功能特点：**\n- 支持自定义样式\n- 动态二维码生成\n- 与 Skyline 云盘深度集成\n\n$[color=#39C5BB 敬请期待！]\n\n#新功能 #多维码",
    icon: "info",
    isRead: true,
    createdAt: "2026-06-28T09:15:00Z",
    updatedAt: "2026-06-29T11:20:00Z",
  },
  {
    id: "4",
    title: "社区规范更新",
    text: "**⚠️ 请所有用户注意**\n\n社区规范已更新，主要变更如下：\n\n1. $[color=#FF6B9D **新增内容审核机制**]\n2. $[color=#FF6B9D **强化隐私保护**]\n3. $[color=#FF6B9D **优化举报流程**]\n\n完整规范请访问 #社区规范 话题。\n\n如有疑问，请联系管理员。",
    icon: "warning",
    isRead: true,
    createdAt: "2026-06-20T16:45:00Z",
  },
];

const iconMap = {
  info: { name: "info", color: "text-cyan-500" },
  warning: { name: "warning", color: "text-yellow-500" },
  error: { name: "error", color: "text-red-500" },
  success: { name: "check_circle", color: "text-green-500" },
};

export default function AnnouncementPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"current" | "past">("current");
  const [announcements, setAnnouncements] = useState(mockAnnouncements);

  const currentAnnouncements = announcements.filter((a) => {
    if (tab === "current") return !a.isRead;
    return a.isRead;
  });

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const handleRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Icon name="campaign" className="text-cyan-500" fontSize={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white">
                {t("announcement.announcements")}
              </h1>
              <p className="text-xs text-gray-500">
                {t("announcement.description")}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
              <Icon name="warning" className="text-yellow-500" fontSize={14} />
              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                {unreadCount} {t("announcement.unread")}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
          {[
            { key: "current" as const, label: t("announcement.current"), icon: "flare" },
            { key: "past" as const, label: t("announcement.past"), icon: "history" },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === tabItem.key
                  ? "bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon name={tabItem.icon} fontSize={16} />
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {currentAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Icon
                    name={tab === "current" ? "check_circle" : "history"}
                    className="text-gray-400"
                    fontSize={32}
                  />
                </div>
                <p className="text-gray-500 font-bold">
                  {tab === "current" ? t("announcement.noUnread") : t("announcement.noPast")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {tab === "current"
                    ? t("announcement.allRead")
                    : t("announcement.readAppearsHere")}
                </p>
              </div>
            ) : (
              currentAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onRead={handleRead}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnnouncementCard({
  announcement,
  onRead,
}: {
  announcement: Announcement;
  onRead: (id: string) => void;
}) {
  const { t } = useI18n();
  const iconInfo = iconMap[announcement.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800 shadow-lg shadow-black/5 overflow-hidden"
    >
      {/* For You Badge */}
      {announcement.forYou && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
          <Icon name="push_pin" className="text-cyan-500" fontSize={14} />
          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
            {t("announcement.exclusiveToYou")}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              announcement.icon === "warning"
                ? "bg-yellow-500/10"
                : announcement.icon === "error"
                ? "bg-red-500/10"
                : announcement.icon === "success"
                ? "bg-green-500/10"
                : "bg-cyan-500/10"
            }`}
          >
            <Icon
              name={iconInfo.name}
              className={iconInfo.color}
              fontSize={20}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {!announcement.isRead && (
                <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
              )}
              <h3 className="text-base font-black text-gray-900 dark:text-white truncate">
                {announcement.title}
              </h3>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Icon name="schedule" fontSize={12} />
                {formatTime(announcement.createdAt, t)}
              </span>
              {announcement.updatedAt && (
                <span className="flex items-center gap-1">
                  <Icon name="edit" fontSize={12} />
                  {t("announcement.updatedAt")} {formatTime(announcement.updatedAt, t)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          <MfmRenderer text={announcement.text} />
        </div>
        {announcement.imageUrl && (
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="mt-3 max-h-[300px] w-full object-cover rounded-xl"
          />
        )}
      </div>

      {/* Footer */}
      {!announcement.isRead && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => onRead(announcement.id)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm transition-colors"
          >
            <Icon name="check" fontSize={16} />
            {t("announcement.gotIt")}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function formatTime(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t("time.justNow");
  if (minutes < 60) return `${minutes} ${t("time.minutesAgo")}`;
  if (hours < 24) return `${hours} ${t("time.hoursAgo")}`;
  if (days < 7) return `${days} ${t("time.daysAgo")}`;
  return date.toLocaleDateString("zh-CN");
}
