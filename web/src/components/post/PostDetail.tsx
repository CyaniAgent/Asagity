"use client";

import { useSplitViewStore } from "@/stores/splitView";
import { PostItem } from "./PostItem";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const mockComments = [
  { id: 1, author: "User A", text: "This is a great update!" },
  { id: 2, author: "User B", text: "Looking forward to more features." },
];

export function PostDetail() {
  const splitViewStore = useSplitViewStore();
  const { currentPost, activeTab } = splitViewStore;
  const { t } = useI18n();

  const tabs = [
    { label: t("post.comments"), value: "comments" },
    { label: t("post.replies"), value: "replies" },
    { label: t("post.reposts"), value: "reposts" },
    { label: t("post.reactions"), value: "reactions" },
  ];

  if (!currentPost) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <Icon name="article" className="mx-auto mb-3 opacity-30" fontSize={40} />
          <p className="text-sm">{t("post.selectPost")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Original Post */}
        <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <PostItem post={currentPost} isDetailView />
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur z-10 px-2">
          <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`whitespace-nowrap py-3 px-1 font-medium text-sm transition-colors duration-200 border-b-2 ${
                  activeTab === tab.value
                    ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                onClick={() => splitViewStore.setTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "comments" && (
            <div className="space-y-3">
              {mockComments.length > 0 ? (
                mockComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
                  >
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                      {comment.author}:{" "}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {comment.text}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <Icon name="comment" className="mx-auto mb-3 opacity-30" fontSize={40} />
                  <p className="text-sm">{t("post.noComments")}</p>
                </div>
              )}
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
      </div>
    </div>
  );
}
