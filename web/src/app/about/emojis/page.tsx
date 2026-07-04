"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const customEmojis = [
  { name: "asagity", aliases: ["ag"], category: "自定义" },
  { name: "miku", aliases: ["hatsune"], category: "角色" },
  { name: "star", aliases: [], category: "符号" },
  { name: "nya", aliases: ["cat"], category: "表情" },
  { name: "fire", aliases: ["lit"], category: "符号" },
  { name: "heart", aliases: ["love"], category: "表情" },
  { name: "sparkle", aliases: ["shine"], category: "符号" },
  { name: "lightning", aliases: ["zap"], category: "符号" },
];

export default function AboutEmojisPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filtered = customEmojis.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col items-center p-8 relative overflow-y-auto">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="emoji" className="text-cyan-500" fontSize={24} />
              {t("about.customEmojis")}
            </h1>
            <button
              onClick={() => router.push("/about")}
              className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t("about.backToOverview")}
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">{filtered.length} emojis available</p>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize={18} />
            <input
              type="text"
              placeholder={t("about.searchEmojis")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        {/* Emoji Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((emoji) => (
            <div key={emoji.name} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[24px] border border-white/40 dark:border-white/10 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-3 mx-auto text-3xl group-hover:scale-110 transition-transform">
                :{emoji.name}:
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">:{emoji.name}:</p>
              <p className="text-[10px] font-bold text-gray-500 mt-1">{emoji.category}</p>
              {emoji.aliases.length > 0 && (
                <div className="flex gap-1 mt-2 justify-center flex-wrap">
                  {emoji.aliases.map((a) => (
                    <span key={a} className="text-[9px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                      :{a}:
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
