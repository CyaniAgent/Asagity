"use client";

import { useState, useMemo } from "react";
import { subHours, subMinutes, subDays } from "date-fns";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface TopicPost {
  id: string;
  author: { avatar: string; displayName: string; username: string; instance?: string };
  createdAt: Date | string;
  content: string;
  metrics: { replies: number; reposts: number; reactions: number };
}

interface Topic {
  id: string;
  name: string;
  displayName?: string;
  updatedAt: Date | string;
  postsCount: number;
  lastPoster: { avatar: string; displayName: string; username: string };
  activityData: number[];
  posts?: TopicPost[];
}

const mockTopics: Topic[] = [
  {
    id: "1", name: "Asagity", displayName: "Asagity",
    updatedAt: subMinutes(new Date(), 5), postsCount: 1247,
    lastPoster: { avatar: "", displayName: "绝对领域SK", username: "syskuku" },
    activityData: [12, 8, 15, 23, 18, 32, 45],
    posts: [
      { id: "p1", author: { avatar: "", displayName: "绝对领域SK", username: "syskuku" }, createdAt: subMinutes(new Date(), 5), content: "终于完成了 Asagity 的新功能开发！大家快来试试看 #Asagity", metrics: { replies: 23, reposts: 45, reactions: 128 } },
      { id: "p2", author: { avatar: "", displayName: "Little", username: "Little" }, createdAt: subMinutes(new Date(), 15), content: "这个平台真的很棒！#Asagity", metrics: { replies: 5, reposts: 12, reactions: 34 } },
    ],
  },
  {
    id: "2", name: "日常", displayName: "日常",
    updatedAt: subHours(new Date(), 1), postsCount: 856,
    lastPoster: { avatar: "", displayName: "Yuna", username: "yuna_ayase" },
    activityData: [20, 25, 18, 30, 28, 35, 22],
    posts: [
      { id: "p3", author: { avatar: "", displayName: "Yuna", username: "yuna_ayase" }, createdAt: subHours(new Date(), 1), content: "今天天气真不错喵~ 想出去散步。#日常", metrics: { replies: 8, reposts: 2, reactions: 15 } },
    ],
  },
  {
    id: "3", name: "Gakumasu", displayName: "Gakumasu",
    updatedAt: subHours(new Date(), 3), postsCount: 432,
    lastPoster: { avatar: "", displayName: "静流", username: "shizuru_official" },
    activityData: [5, 8, 12, 15, 10, 18, 20],
  },
  {
    id: "4", name: "maimai", displayName: "maimai",
    updatedAt: subDays(new Date(), 1), postsCount: 128,
    lastPoster: { avatar: "", displayName: "Miku_39", username: "miku39" },
    activityData: [2, 5, 3, 8, 6, 4, 7],
  },
  {
    id: "5", name: "Vocaloid", displayName: "Vocaloid",
    updatedAt: subDays(new Date(), 2), postsCount: 2048,
    lastPoster: { avatar: "", displayName: "Vocaloid Producer", username: "vocalo_p" },
    activityData: [45, 52, 48, 63, 58, 72, 68],
  },
  {
    id: "6", name: "技术分享", displayName: "技术分享",
    updatedAt: subHours(new Date(), 6), postsCount: 316,
    lastPoster: { avatar: "", displayName: "DevMaster", username: "devmaster" },
    activityData: [8, 12, 10, 15, 18, 14, 20],
  },
  {
    id: "7", name: "游戏", displayName: "游戏",
    updatedAt: subHours(new Date(), 12), postsCount: 567,
    lastPoster: { avatar: "", displayName: "GamerPro", username: "gamerpro" },
    activityData: [15, 20, 18, 25, 30, 22, 28],
  },
  {
    id: "8", name: "音乐", displayName: "音乐",
    updatedAt: subMinutes(new Date(), 30), postsCount: 892,
    lastPoster: { avatar: "", displayName: "MusicLover", username: "musiclvr" },
    activityData: [18, 25, 22, 30, 35, 28, 40],
  },
  {
    id: "9", name: "旅行", displayName: "旅行",
    updatedAt: subDays(new Date(), 3), postsCount: 234,
    lastPoster: { avatar: "", displayName: "TravelBug", username: "travelbug" },
    activityData: [3, 5, 4, 6, 8, 5, 7],
  },
];

function smartTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const width = 96;
  const height = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#39C5BB" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#39C5BB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#39C5BB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        fill="url(#sparkline-grad)"
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  );
}

export default function TopicPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "hot" | "recent" | "trending">("all");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const filteredTopics = useMemo(() => {
    let topics = [...mockTopics];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      topics = topics.filter((t) => t.name.toLowerCase().includes(q) || t.displayName?.toLowerCase().includes(q));
    }
    switch (selectedFilter) {
      case "hot": return topics.sort((a, b) => b.postsCount - a.postsCount);
      case "recent": return topics.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case "trending":
        return topics.sort((a, b) => {
          const aR = a.activityData.slice(-3).reduce((s, v) => s + v, 0);
          const bR = b.activityData.slice(-3).reduce((s, v) => s + v, 0);
          return bR - aR;
        });
      default: return topics;
    }
  }, [searchQuery, selectedFilter]);

  const filterOptions = [
    { value: "all" as const, label: t("topic.all"), icon: "apps" },
    { value: "hot" as const, label: t("topic.popular"), icon: "local_fire_department" },
    { value: "recent" as const, label: t("topic.latest"), icon: "schedule" },
    { value: "trending" as const, label: t("topic.trending"), icon: "trending_up" },
  ];

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="tag" className="text-cyan-500" fontSize={20} />
            {t("topic.topics")}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {mockTopics.length} {t("topic.topics")} · {mockTopics.reduce((s, t) => s + t.postsCount, 0).toLocaleString()} {t("topic.posts")}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 px-4 pb-3 shrink-0">
        <div className="flex-1 relative">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fontSize={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("topic.searchTopics")}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedFilter === f.value
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon name={f.icon} fontSize={14} />
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {filteredTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Icon name="search_off" className="text-gray-300 dark:text-gray-600 mb-4" fontSize={64} />
            <h3 className="text-lg font-bold text-gray-500 mb-2">{t("topic.noTopics")}</h3>
            <p className="text-sm text-gray-400">{t("topic.tryOtherKeywords")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => {
              const isExpanded = expandedTopicId === topic.id;
              return (
                <div
                  key={topic.id}
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className={`relative bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl border p-5 cursor-pointer transition-all shadow-sm hover:shadow-md group overflow-hidden ${
                    isExpanded
                      ? "border-cyan-500 shadow-cyan-500/10 ring-1 ring-cyan-500/20"
                      : "border-gray-100 dark:border-gray-700/50 hover:border-cyan-300 dark:hover:border-cyan-500/50"
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-400">#</span>
                      <h3 className="text-[16px] font-bold text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                        {topic.displayName || topic.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold rounded-full">
                        {topic.postsCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Icon name="schedule" fontSize={12} />
                      <span>{smartTime(topic.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-cyan-500/20 flex items-center justify-center">
                        <Icon name="person" className="text-cyan-500" fontSize={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                          {topic.lastPoster.displayName}
                        </span>
                        <span className="text-[9px] text-gray-400">{t("topic.recentlyActive")}</span>
                      </div>
                    </div>
                    <div className="w-24 h-8">
                      <MiniSparkline data={topic.activityData} />
                    </div>
                  </div>

                  {/* Expanded Posts */}
                  {isExpanded && topic.posts && topic.posts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3 max-h-[300px] overflow-y-auto">
                      {topic.posts.map((post) => (
                        <div key={post.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-cyan-500/20 flex items-center justify-center shrink-0">
                            <Icon name="person" className="text-cyan-500" fontSize={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[12px] font-bold text-gray-900 dark:text-white">{post.author.displayName}</span>
                              <span className="text-[10px] text-gray-400">@{post.author.username}</span>
                            </div>
                            <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{post.content}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                              <span className="flex items-center gap-1"><Icon name="chat_bubble" fontSize={10} />{post.metrics.replies}</span>
                              <span className="flex items-center gap-1"><Icon name="repeat" fontSize={10} />{post.metrics.reposts}</span>
                              <span className="flex items-center gap-1"><Icon name="add" fontSize={10} />{post.metrics.reactions}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-cyan-500/5 to-transparent" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
