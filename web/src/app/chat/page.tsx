"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface Conversation {
  id: string;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  isGroup: boolean;
  memberCount?: number;
  unread: number;
  online?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1", name: "inkink", username: "@inkink", avatar: "",
    lastMessage: "您: 只是里面拉了bot来监测网站服务状态",
    time: "2天前", isGroup: false, unread: 0, online: true,
  },
  {
    id: "2", name: "yuzuki", username: "@yuzuki", avatar: "",
    lastMessage: "我怎么去联合其他社区啊",
    time: "7天前", isGroup: false, unread: 1,
  },
  {
    id: "3", name: "瞿十光", username: "@zhaishis", avatar: "",
    lastMessage: "在吗", time: "2个月前", isGroup: false, unread: 0,
  },
  {
    id: "4", name: "初音ミク", username: "@hatsunemiku", avatar: "",
    lastMessage: "Bot: 准备打歌了！", time: "2个月前", isGroup: false, unread: 0,
  },
  {
    id: "5", name: "技术交流群", username: "@tech_group", avatar: "",
    lastMessage: "Bot: 系统维护通知", time: "2个月前",
    isGroup: true, memberCount: 5, unread: 3,
  },
];

export default function ChatPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [conversations] = useState(mockConversations);

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="chat" className="text-cyan-500" fontSize={20} />
          {t("chat.messages")}
        </h2>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Icon name="edit_square" fontSize={18} />
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col gap-2">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="flex items-center gap-4 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md p-4 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-white/50 dark:border-gray-700/50 hover:border-cyan-500/30 dark:hover:border-cyan-400/30 cursor-pointer group hover:-translate-y-0.5"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-cyan-500/50 transition-all duration-300 shadow-sm">
                  {chat.avatar ? (
                    <Image src={chat.avatar} width={48} height={48} className="w-full h-full object-cover" alt={chat.name} />
                  ) : (
                    <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
                      <Icon name="person" className="text-cyan-500" fontSize={22} />
                    </div>
                  )}
                </div>
                {chat.unread > 0 ? (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-400 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center shadow-sm z-10">
                    {chat.unread > 1 ? (
                      <span className="text-[10px] font-bold text-white leading-none">{chat.unread}</span>
                    ) : (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    )}
                  </div>
                ) : chat.online ? (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full shadow-sm z-10" />
                ) : null}
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden py-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {chat.name}
                  </span>
                  {chat.isGroup && (
                    <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/60 px-1.5 py-0.5 rounded-md">
                      ({chat.memberCount}人)
                    </span>
                  )}
                  <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                    {chat.username}
                  </span>
                </div>
                <p className={`text-[14px] truncate w-full ${
                  chat.unread > 0
                    ? "text-gray-900 dark:text-white font-bold"
                    : "text-gray-600 dark:text-gray-300/80 font-medium"
                }`}>
                  {chat.lastMessage}
                </p>
              </div>

              {/* Time */}
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 group-hover:text-cyan-500 transition-colors">
                  {chat.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
