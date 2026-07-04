"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface UserData {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended" | "silenced";
  origin: "local" | "remote";
  posts: number;
  followers: number;
  following: number;
  createdAt: string;
  lastActive: string;
  bio: string;
 	ip: string;
}

const mockUsers: Record<string, UserData> = {
  "1": { id: "1", username: "Developer", displayName: "CyaniAgent", role: "admin", status: "active", origin: "local", posts: 1240, followers: 5600, following: 320, createdAt: "2024-01-15", lastActive: "2 min ago", bio: "Asagity Developer & Maintainer", ip: "192.168.1.100" },
  "2": { id: "2", username: "inkink", displayName: "inkink", role: "moderator", status: "active", origin: "local", posts: 890, followers: 2300, following: 180, createdAt: "2024-03-20", lastActive: "1 hour ago", bio: "Community Moderator", ip: "192.168.1.101" },
  "3": { id: "3", username: "hatsunemiku", displayName: "初音ミク", role: "user", status: "active", origin: "local", posts: 5600, followers: 12000, following: 450, createdAt: "2024-02-10", lastActive: "3 hours ago", bio: "未来の歌姫", ip: "10.0.0.50" },
  "4": { id: "4", username: "spambot_001", displayName: "Spam Bot", role: "user", status: "suspended", origin: "remote", posts: 0, followers: 0, following: 999, createdAt: "2025-06-28", lastActive: "2 days ago", bio: "", ip: "203.0.113.42" },
};

const roleColors = {
  admin: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  moderator: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  user: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const statusColors = {
  active: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  silenced: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function PanelUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const user = mockUsers[id];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Icon name="error" className="text-red-400 mb-4" fontSize={48} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("panel.userNotFound")}</h2>
        <p className="text-sm text-gray-500 mt-2">{t("panel.idNotFound", { id })}</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-full bg-cyan-500 text-white text-sm font-bold">
          {t("common.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-500 transition-colors">
        <Icon name="arrow_left" fontSize={16} />
        {t("panel.backToUserList")}
      </button>

      {/* User Header */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
            <Icon name="person" className="text-cyan-500" fontSize={28} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.displayName}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>{user.role}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[user.status]}`}>{user.status}</span>
            </div>
            <p className="text-sm text-gray-500 mb-2">@{user.username} • {user.origin}</p>
            {user.bio && <p className="text-sm text-gray-700 dark:text-gray-300">{user.bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center">
            <p className="text-2xl font-black text-gray-900 dark:text-white">{user.posts.toLocaleString()}</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.posts")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-900 dark:text-white">{user.followers.toLocaleString()}</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.followers")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-900 dark:text-white">{user.following}</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.following")}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{user.createdAt}</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.registered")}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm">
        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">{t("panel.adminActions")}</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded-2xl text-sm font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-2">
            <Icon name="warning" fontSize={16} />
            {t("panel.banUser")}
          </button>
          <button className="px-4 py-2 rounded-2xl text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Icon name="eye" fontSize={16} />
            {t("panel.silenceUser")}
          </button>
          <button className="px-4 py-2 rounded-2xl text-sm font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors flex items-center gap-2">
            <Icon name="shield" fontSize={16} />
            {t("panel.setAsModerator")}
          </button>
          <button className="px-4 py-2 rounded-2xl text-sm font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2">
            <Icon name="delete" fontSize={16} />
            {t("panel.deleteAccount")}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm">
        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">{t("panel.detailedInfo")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t("panel.userId")}</p>
            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{user.id}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t("panel.ipAddress")}</p>
            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{user.ip}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t("panel.lastActive")}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{user.lastActive}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t("panel.origin")}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{user.origin}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
