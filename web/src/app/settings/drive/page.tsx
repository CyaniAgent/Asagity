"use client";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export default function DriveSettingsPage() {
  const { t } = useI18n();
  const usedBytes = 0;
  const maxBytes = 1073741824; // 1GB
  const usedPercent = Math.round((usedBytes / maxBytes) * 100);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="max-w-[700px] mx-auto p-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="cloud" className="text-white" fontSize={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.cloudDrive")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.manageFiles")}</p>
        </div>
      </div>

      {/* Storage Usage */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="pie_chart" className="text-cyan-500" fontSize={18} />
            {t("settings.storageSpace")}
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{formatSize(usedBytes)} {t("settings.used")}</span>
            <span className="font-bold text-cyan-500">{formatSize(maxBytes)} {t("settings.total")}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* File Management */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="folder" className="text-cyan-500" fontSize={18} />
            {t("settings.fileManagement")}
          </h2>
        </div>
        <div className="p-4">
          <div className="text-center text-gray-400 py-8">
            <Icon name="cloud_upload" className="mx-auto mb-3 opacity-30" fontSize={48} />
            <p className="text-sm">{t("settings.driveDevelopment")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("settings.driveDevelopmentDesc")}</p>
          </div>
        </div>
      </section>

      {/* Upload Settings */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="settings" className="text-cyan-500" fontSize={18} />
            {t("settings.uploadSettings")}
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.autoCompress")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.autoCompressDesc")}</div>
            </div>
            <div className="w-11 h-6 bg-cyan-500 rounded-full relative">
              <span className="absolute top-0.5 left-5.5 w-5 h-5 bg-white rounded-full shadow translate-x-5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.keepExif")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.keepExifDesc")}</div>
            </div>
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
