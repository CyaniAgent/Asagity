"use client";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export default function DriveSharedPage() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="folder_shared" className="text-cyan-500" fontSize={20} />
            {t("drive.sharedFiles")}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("drive.sharedWithOthers")}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-full text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all">
          <Icon name="share" fontSize={16} />
          {t("drive.sharedFiles")}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="text-center text-gray-400 py-20">
          <Icon name="folder_shared" className="mx-auto mb-4 opacity-20" fontSize={64} />
          <p className="text-sm font-semibold">{t("drive.noSharedFiles")}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("drive.sharedInDevelopment")}</p>
        </div>
      </div>
    </div>
  );
}
