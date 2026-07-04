"use client";

import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface Emoji {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  createdAt: string;
}

const mockEmojis: Emoji[] = [
  { id: "1", name: "asagity", category: "自定义", aliases: ["ag"], createdAt: "2024-01-15" },
  { id: "2", name: "miku", category: "角色", aliases: ["hatsune"], createdAt: "2024-02-10" },
  { id: "3", name: "star", category: "符号", aliases: [], createdAt: "2024-03-01" },
  { id: "4", name: "nya", category: "表情", aliases: ["cat"], createdAt: "2024-04-12" },
  { id: "5", name: "fire", category: "符号", aliases: ["lit"], createdAt: "2024-05-20" },
];

export default function PanelEmojisPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filtered = mockEmojis.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Icon name="emoji" className="text-cyan-500" fontSize={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t("panel.customEmojis")}</h1>
            <p className="text-xs font-bold text-gray-500">{filtered.length} emojis</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-full text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-md shadow-cyan-500/20">
          <Icon name="add" fontSize={16} />
          {t("panel.addEmoji")}
        </button>
      </div>

      <div className="relative">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize={18} />
        <input
          type="text"
          placeholder={t("panel.searchEmojiPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((emoji) => (
          <div key={emoji.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-3 mx-auto text-3xl">
              :{emoji.name}:
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white text-center truncate">:{emoji.name}:</p>
            <p className="text-[10px] font-bold text-gray-500 text-center mt-1">{emoji.category}</p>
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
  );
}
