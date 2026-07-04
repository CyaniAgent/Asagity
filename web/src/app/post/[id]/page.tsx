"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api } from "@/lib/api";
import type { TimelinePost } from "@/types/models";
import { PostItem } from "@/components/post/PostItem";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const MainLayout = dynamic(
  () => import("@/components/layout/MainLayout").then((m) => m.MainLayout),
  { ssr: false }
);

interface PostPageParams {
  id: string;
}

export default function PostPage({ params }: { params: Promise<PostPageParams> }) {
  const { t } = useI18n();
  const { id } = use(params);
  const [post, setPost] = useState<TimelinePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("comments");

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<TimelinePost>(`/api/notes/${id}`);
        setPost(data);
      } catch (err) {
        setError((err as Error).message || t("post.notFound"));
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  const tabs = [
    { label: t("post.comments"), value: "comments" },
    { label: t("post.replies"), value: "replies" },
    { label: t("post.reposts"), value: "reposts" },
    { label: t("post.reactions"), value: "reactions" },
  ];

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
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{t("post.post")}</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Icon name="refresh" className="animate-spin text-cyan-500" fontSize={32} />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <Icon name="error" className="text-red-400 mb-4" fontSize={48} />
              <h2 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
                {t("post.failedToLoad")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[300px]">
                {error}
              </p>
              <Link
                href="/"
                className="mt-6 px-4 py-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-colors"
              >
                {t("common.backToTimeline")}
              </Link>
            </div>
          )}

          {!loading && !error && post && (
            <>
              {/* Post */}
              <PostItem post={post} isDetailView />

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
                {activeTab === "comments" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="comment" className="mx-auto mb-3 opacity-30" fontSize={40} />
                    <p className="text-sm">{t("post.noComments")}</p>
                  </div>
                )}
                {activeTab === "replies" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="chat" className="mx-auto mb-3 opacity-30" fontSize={40} />
                    <p className="text-sm">{t("common.moduleInDev")}</p>
                  </div>
                )}
                {activeTab === "reposts" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="repeat" className="mx-auto mb-3 opacity-30" fontSize={40} />
                    <p className="text-sm">{t("common.moduleInDev")}</p>
                  </div>
                )}
                {activeTab === "reactions" && (
                  <div className="text-center text-gray-400 py-12">
                    <Icon name="add" className="mx-auto mb-3 opacity-30" fontSize={40} />
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
