"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "high" | "normal" | "low";
  createdAt: string;
  expiresAt: string;
}

const mockAnnouncements: Announcement[] = [
  { id: "1", title: "系统维护通知", content: "今晚 22:00-23:00 将进行例行维护，届时服务将暂时不可用。", priority: "high", createdAt: "2025-06-30", expiresAt: "2025-07-01" },
  { id: "2", title: "新功能发布", content: "Asagity 聊天模块已上线，支持端到端加密消息！", priority: "normal", createdAt: "2025-06-28", expiresAt: "2025-07-15" },
  { id: "3", title: "社区规则更新", content: "请所有用户查看更新后的社区规则，确保遵守相关规定。", priority: "normal", createdAt: "2025-06-20", expiresAt: "2025-12-31" },
];

const priorityColors = {
  high: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  normal: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function PanelAnnouncementsPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Icon name="campaign" className="text-cyan-500" fontSize={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t("panel.announcementManagement")}</h1>
            <p className="text-xs font-bold text-gray-500">{mockAnnouncements.length} announcements</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-full text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-md shadow-cyan-500/20">
          <Icon name="add" fontSize={16} />
          {t("panel.publishAnnouncement")}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {mockAnnouncements.map((a) => (
          <div key={a.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white">{a.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[a.priority]}`}>
                  {a.priority}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="text-gray-400 hover:text-cyan-500 transition-colors">
                  <Icon name="edit" fontSize={16} />
                </button>
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <Icon name="delete" fontSize={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{a.content}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{t("panel.created")} {a.createdAt}</span>
              <span>{t("panel.expires")} {a.expiresAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
