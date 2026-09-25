"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface Abuse {
  id: string;
  reporter: string;
  target: string;
  reason: string;
  category: "spam" | "harassment" | "illegal" | "other";
  status: "unresolved" | "resolved" | "dismissed";
  createdAt: string;
}

const mockAbuses: Abuse[] = [
  { id: "1", reporter: "inkink", target: "spambot_001", reason: "发送大量垃圾广告", category: "spam", status: "unresolved", createdAt: "2025-06-30" },
  { id: "2", reporter: "yuzuki", target: "troll_user", reason: "持续骚扰其他用户", category: "harassment", status: "unresolved", createdAt: "2025-06-29" },
  { id: "3", reporter: "hatsunemiku", target: "bad_actor", reason: "发布违规内容", category: "illegal", status: "resolved", createdAt: "2025-06-25" },
];

const categoryColors = {
  spam: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  harassment: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  illegal: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const statusColors = {
  unresolved: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  resolved: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  dismissed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function PanelAbusesPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <Icon name="flag" className="text-cyan-500" fontSize={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{t("panel.reportHandling")}</h1>
          <p className="text-xs font-bold text-gray-500">{mockAbuses.filter((a) => a.status === "unresolved").length} unresolved</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {mockAbuses.map((a) => (
          <div key={a.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[a.category]}`}>
                  {a.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>
                  {a.status}
                </span>
              </div>
              <span className="text-xs text-gray-500">{a.createdAt}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span className="font-bold text-gray-900 dark:text-white">{a.reporter}</span> {t("panel.reported")}{" "}
              <span className="font-bold text-gray-900 dark:text-white">{a.target}</span>
            </p>
            <p className="text-sm text-gray-500 mb-3">{a.reason}</p>
            {a.status === "unresolved" && (
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                  {t("panel.handleReport")}
                </button>
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  {t("panel.dismiss")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
