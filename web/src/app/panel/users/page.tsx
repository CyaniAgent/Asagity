"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface User {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended" | "silenced";
  origin: "local" | "remote";
  posts: number;
  followers: number;
  createdAt: string;
  lastActive: string;
}

const mockUsers: User[] = [
  { id: "1", username: "Developer", displayName: "CyaniAgent", role: "admin", status: "active", origin: "local", posts: 1240, followers: 5600, createdAt: "2024-01-15", lastActive: "2 min ago" },
  { id: "2", username: "inkink", displayName: "inkink", role: "moderator", status: "active", origin: "local", posts: 890, followers: 2300, createdAt: "2024-03-20", lastActive: "1 hour ago" },
  { id: "3", username: "hatsunemiku", displayName: "初音ミク", role: "user", status: "active", origin: "local", posts: 5600, followers: 12000, createdAt: "2024-02-10", lastActive: "3 hours ago" },
  { id: "4", username: "spambot_001", displayName: "Spam Bot", role: "user", status: "suspended", origin: "remote", posts: 0, followers: 0, createdAt: "2025-06-28", lastActive: "2 days ago" },
  { id: "5", username: "mastodon_user", displayName: "Mastodon Friend", role: "user", status: "active", origin: "remote", posts: 340, followers: 890, createdAt: "2024-05-12", lastActive: "5 hours ago" },
  { id: "6", username: "yuzuki", displayName: "yuzuki", role: "user", status: "active", origin: "local", posts: 210, followers: 450, createdAt: "2024-08-01", lastActive: "1 day ago" },
];

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

export default function PanelUsersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");

  const filteredUsers = mockUsers.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.displayName.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchOrigin = originFilter === "all" || u.origin === originFilter;
    return matchSearch && matchRole && matchOrigin;
  });

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Icon name="group" className="text-cyan-500" fontSize={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t("panel.userManagement")}</h1>
            <p className="text-xs font-bold text-gray-500">{filteredUsers.length} users found</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-full text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-md shadow-cyan-500/20">
          <Icon name="add" fontSize={16} />
          {t("panel.addUser")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize={18} />
          <input
            type="text"
            placeholder={t("panel.searchUserPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">{t("panel.allRoles")}</option>
          <option value="admin">{t("panel.admin")}</option>
          <option value="moderator">{t("panel.moderator")}</option>
          <option value="user">{t("panel.regularUser")}</option>
        </select>
        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">{t("panel.allOrigins")}</option>
          <option value="local">{t("panel.local")}</option>
          <option value="remote">{t("panel.remote")}</option>
        </select>
      </div>

      {/* User List */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-200/50 dark:border-gray-700/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>{t("panel.user")}</span>
          <span>{t("panel.role")}</span>
          <span>{t("panel.status")}</span>
          <span>{t("panel.origin")}</span>
          <span>{t("panel.posts")}</span>
          <span>{t("panel.lastActive")}</span>
        </div>
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => router.push(`/panel/users/${user.id}`)}
            className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-100/50 dark:border-gray-800/50 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer items-center"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Icon name="person" className="text-cyan-500" fontSize={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>
              {user.role}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[user.status]}`}>
              {user.status}
            </span>
            <span className="text-xs font-bold text-gray-500">{user.origin}</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{user.posts.toLocaleString()}</span>
            <span className="text-xs font-bold text-gray-500">{user.lastActive}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
