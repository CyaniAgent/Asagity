"use client";

import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface Instance {
  id: string;
  name: string;
  domain: string;
  status: "federating" | "subscribing" | "publishing" | "suspended" | "blocked";
  users: number;
  notes: number;
  following: number;
  followers: number;
  software: string;
  version: string;
  lastSeen: string;
}

const mockInstances: Instance[] = [
  { id: "1", name: "Mastodon Social", domain: "mastodon.social", status: "federating", users: 850000, notes: 12000000, following: 2000000, followers: 3000000, software: "Mastodon", version: "4.3.0", lastSeen: "2 min ago" },
  { id: "2", name: "Pixiv Fed", domain: "fedibird.com", status: "federating", users: 120000, notes: 3500000, following: 400000, followers: 600000, software: "Mastodon", version: "4.2.0", lastSeen: "5 min ago" },
  { id: "3", name: "Misskey Hub", domain: "misskey.io", status: "federating", users: 45000, notes: 890000, following: 120000, followers: 200000, software: "Misskey", version: "2024.5.0", lastSeen: "1 min ago" },
  { id: "4", name: "Spam Instance", domain: "spam-bot.xyz", status: "blocked", users: 0, notes: 0, following: 0, followers: 0, software: "Unknown", version: "N/A", lastSeen: "Never" },
  { id: "5", name: "Calckey Social", domain: "calckey.social", status: "suspended", users: 8000, notes: 45000, following: 12000, followers: 15000, software: "Firefish", version: "1.0.0", lastSeen: "3 days ago" },
];

const statusColors: Record<string, string> = {
  federating: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  subscribing: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  publishing: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  suspended: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  blocked: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  federating: "panel.federated",
  subscribing: "panel.subscribing",
  publishing: "panel.publishing",
  suspended: "panel.suspended",
  blocked: "panel.banned",
};

export default function PanelFederationPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockInstances.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.domain.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Icon name="globe" className="text-cyan-500" fontSize={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t("panel.federationManagement")}</h1>
            <p className="text-xs font-bold text-gray-500">{filtered.length} instances</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize={18} />
          <input
            type="text"
            placeholder={t("panel.searchInstancePlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">{t("panel.allStatus")}</option>
          <option value="federating">{t("panel.federated")}</option>
          <option value="subscribing">{t("panel.subscribing")}</option>
          <option value="publishing">{t("panel.publishing")}</option>
          <option value="suspended">{t("panel.suspended")}</option>
          <option value="blocked">{t("panel.banned")}</option>
        </select>
      </div>

      {/* Instance List */}
      <div className="grid gap-4">
        {filtered.map((instance) => (
          <div
            key={instance.id}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
                  {instance.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {instance.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-500">{instance.domain}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[instance.status]}`}>
                {t(statusLabels[instance.status])}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                <p className="text-lg font-black text-gray-900 dark:text-white">{(instance.users / 1000).toFixed(0)}K</p>
                <p className="text-[10px] font-bold text-gray-500">{t("panel.totalUsers")}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                <p className="text-lg font-black text-gray-900 dark:text-white">{(instance.notes / 1000000).toFixed(1)}M</p>
                <p className="text-[10px] font-bold text-gray-500">{t("panel.posts")}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                <p className="text-lg font-black text-gray-900 dark:text-white">{(instance.followers / 1000).toFixed(0)}K</p>
                <p className="text-[10px] font-bold text-gray-500">{t("panel.followers")}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                <p className="text-lg font-black text-gray-900 dark:text-white">{(instance.following / 1000).toFixed(0)}K</p>
                <p className="text-[10px] font-bold text-gray-500">{t("panel.following")}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{instance.software} v{instance.version}</span>
              <span>{t("panel.lastSeen")} {instance.lastSeen}</span>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {t("panel.viewDetails")}
              </button>
              <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                {t("panel.silence")}
              </button>
              <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                {t("panel.ban")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
