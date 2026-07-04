"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface ModLog {
  id: string;
  admin: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

const mockLogs: ModLog[] = [
  { id: "1", admin: "Developer", action: "封禁用户", target: "spambot_001", details: "发送垃圾广告", createdAt: "2025-06-30 10:30" },
  { id: "2", admin: "inkink", action: "删除帖子", target: "post_12345", details: "违规内容", createdAt: "2025-06-30 09:15" },
  { id: "3", admin: "Developer", action: "封禁实例", target: "spam-bot.xyz", details: "恶意实例", createdAt: "2025-06-29 18:00" },
  { id: "4", admin: "inkink", action: "静默用户", target: "troll_user", details: "持续骚扰", createdAt: "2025-06-29 14:30" },
  { id: "5", admin: "Developer", action: "更新系统", target: "v2.4.0", details: "核心系统升级", createdAt: "2025-06-28 22:00" },
];

const actionColors: Record<string, string> = {
  "封禁用户": "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "删除帖子": "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "封禁实例": "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "静默用户": "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "更新系统": "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

export default function PanelModlogPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <Icon name="history" className="text-cyan-500" fontSize={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{t("panel.adminLog")}</h1>
          <p className="text-xs font-bold text-gray-500">{mockLogs.length} entries</p>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-gray-200/50 dark:border-gray-700/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>{t("panel.admin")}</span>
          <span>{t("panel.action")}</span>
          <span>{t("panel.target")}</span>
          <span>{t("panel.details")}</span>
          <span>{t("panel.time")}</span>
        </div>
        {mockLogs.map((log) => (
          <div key={log.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-gray-100/50 dark:border-gray-800/50 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Icon name="person" className="text-cyan-500" fontSize={14} />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{log.admin}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${actionColors[log.action] || "bg-gray-100 text-gray-600"}`}>
              {log.action}
            </span>
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">{log.target}</span>
            <span className="text-sm text-gray-500 truncate">{log.details}</span>
            <span className="text-xs text-gray-500 whitespace-nowrap">{log.createdAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
