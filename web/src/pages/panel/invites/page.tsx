"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

interface InviteCode {
  id: string;
  code: string;
  usedBy: string | null;
  createdAt: string;
  expiresAt: string;
  status: "active" | "used" | "expired";
}

const mockInvites: InviteCode[] = [
  { id: "1", code: "ASAGITY-XXXX-0001", usedBy: "newuser1", createdAt: "2025-06-28", expiresAt: "2025-07-28", status: "used" },
  { id: "2", code: "ASAGITY-XXXX-0002", usedBy: null, createdAt: "2025-06-30", expiresAt: "2025-07-30", status: "active" },
  { id: "3", code: "ASAGITY-XXXX-0003", usedBy: null, createdAt: "2025-06-30", expiresAt: "2025-07-30", status: "active" },
  { id: "4", code: "ASAGITY-XXXX-0004", usedBy: null, createdAt: "2025-06-20", expiresAt: "2025-06-27", status: "expired" },
];

const statusColors = {
  active: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  used: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  expired: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function PanelInvitesPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Icon name="key" className="text-cyan-500" fontSize={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t("panel.inviteCodes")}</h1>
            <p className="text-xs font-bold text-gray-500">{mockInvites.filter((i) => i.status === "active").length} active</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-full text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-md shadow-cyan-500/20">
          <Icon name="add" fontSize={16} />
          {t("panel.generateInviteCode")}
        </button>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm overflow-hidden">
        {mockInvites.map((invite, i) => (
          <div
            key={invite.id}
            className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
              i < mockInvites.length - 1 ? "border-b border-gray-100/50 dark:border-gray-800/50" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{invite.code}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[invite.status]}`}>
                {invite.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {invite.usedBy && <span>{t("panel.used")} {invite.usedBy}</span>}
              <span>{t("panel.expires")} {invite.expiresAt}</span>
              <button className="text-gray-400 hover:text-cyan-500 transition-colors">
                <Icon name="copy" fontSize={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
