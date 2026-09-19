"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface Clip {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  postsCount: number;
  updatedAt: Date;
  color: string;
}

const mockClips: Clip[] = [
  {
    id: "c1",
    name: "灵感收集",
    description: "记录生活中的灵感和想法",
    isPublic: true,
    postsCount: 24,
    updatedAt: new Date(2026, 5, 28),
    color: "cyan",
  },
  {
    id: "c2",
    name: "技术笔记",
    description: "编程和技术相关的收藏",
    isPublic: false,
    postsCount: 56,
    updatedAt: new Date(2026, 5, 27),
    color: "teal",
  },
  {
    id: "c3",
    name: "Vocaloid 精选",
    description: "Vocaloid 相关的优质内容",
    isPublic: true,
    postsCount: 128,
    updatedAt: new Date(2026, 5, 25),
    color: "pink",
  },
  {
    id: "c4",
    name: "学习资料",
    description: "有价值的学习资源和教程",
    isPublic: false,
    postsCount: 42,
    updatedAt: new Date(2026, 5, 20),
    color: "amber",
  },
];

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-500", ring: "ring-cyan-500/20" },
  teal: { bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-500", ring: "ring-teal-500/20" },
  pink: { bg: "bg-pink-50 dark:bg-pink-500/10", text: "text-pink-500", ring: "ring-pink-500/20" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-500", ring: "ring-amber-500/20" },
};

export default function BookmarksPage() {
  const { t } = useI18n();
  const [clips, setClips] = useState(mockClips);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClipName, setNewClipName] = useState("");
  const [newClipDesc, setNewClipDesc] = useState("");
  const [newClipPublic, setNewClipPublic] = useState(true);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newClipName.trim()) return;
    const newClip: Clip = {
      id: `c${Date.now()}`,
      name: newClipName,
      description: newClipDesc,
      isPublic: newClipPublic,
      postsCount: 0,
      updatedAt: new Date(),
      color: ["cyan", "teal", "pink", "amber"][Math.floor(Math.random() * 4)],
    };
    setClips((prev) => [newClip, ...prev]);
    setNewClipName("");
    setNewClipDesc("");
    setNewClipPublic(true);
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (selectedClip === id) setSelectedClip(null);
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="bookmark" className="text-cyan-500" fontSize={20} />
            {t("bookmarks.bookmarks")}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("bookmarks.description")}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-full text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
        >
          <Icon name="add" fontSize={16} />
          {t("bookmarks.newBookmark")}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Icon name="bookmark_border" className="text-gray-300 dark:text-gray-600 mb-4" fontSize={64} />
            <h3 className="text-lg font-bold text-gray-500 mb-2">{t("bookmarks.noBookmarks")}</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("bookmarks.noBookmarksDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clips.map((clip) => {
              const colors = colorMap[clip.color] || colorMap.cyan;
              const isSelected = selectedClip === clip.id;
              return (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClip(isSelected ? null : clip.id)}
                  className={`relative bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl border-2 p-5 cursor-pointer transition-all shadow-sm hover:shadow-md group ${
                    isSelected
                      ? "border-cyan-500 shadow-cyan-500/10"
                      : "border-gray-100 dark:border-gray-700/50 hover:border-cyan-300 dark:hover:border-cyan-500/50"
                  }`}
                >
                  {/* Color Indicator */}
                  <div className={`w-10 h-10 rounded-2xl ${colors.bg} flex items-center justify-center mb-3`}>
                    <Icon name={clip.isPublic ? "public" : "lock"} className={colors.text} fontSize={20} />
                  </div>

                  {/* Name + Count */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {clip.name}
                    </h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {clip.postsCount}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {clip.description || t("bookmarks.noDescription")}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {clip.updatedAt.toLocaleDateString("zh-CN")}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(clip.id); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Icon name="delete" fontSize={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 space-y-5 animate-[fadeInUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("bookmarks.newBookmark")}</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t("bookmarks.name")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newClipName}
                onChange={(e) => setNewClipName(e.target.value)}
                placeholder={t("bookmarks.enterName")}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t("bookmarks.description")}</label>
              <textarea
                value={newClipDesc}
                onChange={(e) => setNewClipDesc(e.target.value)}
                placeholder={t("bookmarks.describePurpose")}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("bookmarks.visibility")}</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setNewClipPublic(true)}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    newClipPublic
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon name="public" className={newClipPublic ? "text-cyan-500" : "text-gray-400"} fontSize={18} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t("bookmarks.public")}</span>
                </button>
                <button
                  onClick={() => setNewClipPublic(false)}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    !newClipPublic
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon name="lock" className={!newClipPublic ? "text-cyan-500" : "text-gray-400"} fontSize={18} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t("bookmarks.private")}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newClipName.trim()}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-400 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t("bookmarks.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
