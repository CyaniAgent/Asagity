"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import type { UserDetail } from "@/types/models";
import { MfmRenderer } from "@/components/post/MfmRenderer";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const MainLayout = dynamic(
  () => import("@/components/layout/MainLayout").then((m) => m.MainLayout),
  { ssr: false }
);

interface UserPageParams {
  id: string;
}

export default function UserPage({ params }: { params: Promise<UserPageParams> }) {
  const { t } = useI18n();
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const tabs = [
    { label: t("tabs.home"), value: "home" },
    { label: t("tabs.timeline"), value: "posts" },
    { label: t("tabs.files"), value: "files" },
    { label: t("tabs.rawData"), value: "raw" },
  ];

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<UserDetail>(`/api/users/${id}`);
        setUser(data);
      } catch {
        setError(t("post.userNotFound"));
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/api/users/${id}/follow`);
      } else {
        await api.post(`/api/users/${id}/follow`);
      }
      setIsFollowing(!isFollowing);
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 -m-6 lg:-m-10">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Icon name="arrow_left" fontSize={18} />
          </Link>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{t("post.user")}</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Icon name="refresh" className="animate-spin text-cyan-500" fontSize={32} />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <Icon name="error" className="text-red-400 mb-4" fontSize={48} />
              <h2 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">{t("post.failedToLoadUser")}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
              <Link
                href="/"
                className="mt-6 px-4 py-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-colors"
              >
                {t("common.backToTimeline")}
              </Link>
            </div>
          )}

          {!loading && !error && user && (
            <>
              {/* Banner */}
              <div className="relative h-44 w-full overflow-hidden">
                {user.banner ? (
                  <Image src={user.banner} fill className="object-cover" alt="Banner" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-400/80 via-teal-400 to-cyan-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Profile Header */}
              <div className="px-6 pb-4">
                {/* Avatar + Actions Row */}
                <div className="flex items-end justify-between -mt-12 relative z-10 mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden ring-[5px] ring-white dark:ring-gray-950 shadow-lg">
                      {user.avatar ? (
                        <Image src={user.avatar} width={96} height={96} className="w-full h-full object-cover" alt={user.displayName} />
                      ) : (
                        <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
                          <Icon name="person" className="text-cyan-500" fontSize={36} />
                        </div>
                      )}
                    </div>
                    {user.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center border-2 border-cyan-500">
                        <Icon name="check" className="text-cyan-500" fontSize={12} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pb-1">
                    <button className="flex items-center justify-center w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                      <Icon name="more_horiz" fontSize={18} />
                    </button>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                        isFollowing
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500"
                          : "bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105"
                      }`}
                    >
                      {followLoading ? (
                        <Icon name="refresh" className="animate-spin" fontSize={14} />
                      ) : isFollowing ? (
                        t("post.following")
                      ) : (
                        t("post.follow")
                      )}
                    </button>
                  </div>
                </div>

                {/* Name + Username */}
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {user.displayName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    @{user.username}{user.instance ? `@${user.instance}` : ""}
                  </p>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <MfmRenderer text={user.bio} />
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
                  {user.location && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Icon name="location_on" className="text-cyan-500" fontSize={16} />
                      {user.location}
                    </span>
                  )}
                  {user.birthday && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Icon name="cake" className="text-pink-400" fontSize={16} />
                      {user.birthday}
                    </span>
                  )}
                  {user.joinedAt && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Icon name="event" className="text-cyan-500" fontSize={16} />
                      {user.joinedAt}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-1 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  {[
                    { label: t("post.posts"), value: user.stats?.posts ?? 0 },
                    { label: t("post.following"), value: user.stats?.following ?? 0 },
                    { label: t("post.fans"), value: user.stats?.followers ?? 0 },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex-1 flex flex-col items-center py-2.5 rounded-xl hover:bg-white dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-lg text-gray-900 dark:text-white">{stat.value}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-800 sticky top-[52px] bg-white/90 dark:bg-gray-900/90 backdrop-blur z-10 px-2">
                <nav className="flex space-x-4" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.value}
                      className={`whitespace-nowrap py-3 px-1 font-medium text-sm transition-colors duration-200 border-b-2 ${
                        activeTab === tab.value
                          ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab(tab.value)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === "home" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="push_pin" className="mx-auto mb-3 opacity-30" fontSize={40} />
                    <p className="text-sm">{t("post.noPinned")}</p>
                  </div>
                )}
                {activeTab === "posts" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="article" className="mx-auto mb-3 opacity-30" fontSize={40} />
                    <p className="text-sm">{t("common.moduleInDev")}</p>
                  </div>
                )}
                {activeTab === "files" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="folder" className="mx-auto mb-3 opacity-30" fontSize={40} />
                    <p className="text-sm">{t("common.moduleInDev")}</p>
                  </div>
                )}
                {activeTab === "raw" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="terminal" className="mx-auto mb-3 opacity-30" fontSize={40} />
                    <p className="text-sm">{t("common.moduleInDev")}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
