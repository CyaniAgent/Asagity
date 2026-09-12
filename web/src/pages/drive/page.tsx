"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

function formatBytes(value: number, inputUnit: "B" | "KB" | "MB" | "GB" | "TB" = "MB") {
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitFactor: Record<string, number> = {
    B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4,
  };
  const bytes = value * unitFactor[inputUnit];
  let i = Math.floor(Math.log(bytes) / Math.log(1024));
  i = Math.max(0, Math.min(i, units.length - 1));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${units[i]}`;
}

interface DriveItem {
  id: string;
  type: "folder" | "file";
  name: string;
  modifiedAt: Date;
  sizeMB: number;
}

const initialItems: DriveItem[] = [
  { id: "f1", type: "folder", name: "Images", modifiedAt: new Date(2026, 2, 20), sizeMB: 1250 },
  { id: "f2", type: "folder", name: "Projects", modifiedAt: new Date(2026, 2, 22), sizeMB: 540 },
  { id: "f3", type: "folder", name: "Music", modifiedAt: new Date(2026, 2, 23), sizeMB: 800 },
  { id: "fi1", type: "file", name: "design-tokens.md", modifiedAt: new Date(2026, 2, 24), sizeMB: 0.02 },
  { id: "fi2", type: "file", name: "Project_Alpha_v2.zip", modifiedAt: new Date(2026, 2, 18), sizeMB: 45.5 },
  { id: "fi3", type: "file", name: "screen_recording.webp", modifiedAt: new Date(2026, 2, 19), sizeMB: 12.3 },
];

interface Breadcrumb {
  id: string;
  name: string;
}

export default function DrivePage() {
  const { t } = useI18n();
  const [isGridView, setIsGridView] = useState(false);
  const [breadcrumbs] = useState<Breadcrumb[]>([
    { id: "root", name: t("drive.myCloudDrive") },
    { id: "f1", name: "Images" },
  ]);

  const totalCapacityMB = 16384;
  const usedCapacityMB = 3549;
  const progressPercentage = (usedCapacityMB / totalCapacityMB) * 100;

  const sortedItems = useMemo(() => {
    return [...initialItems].sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });
  }, []);

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 py-3 shrink-0">
        {/* Capacity Progress */}
        <div className="flex flex-col gap-2 w-full md:w-80 shrink-0">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Icon name="cloud" fontSize={14} />
              {formatBytes(usedCapacityMB, "MB")} used
            </span>
            <span>{formatBytes(totalCapacityMB, "MB")} total</span>
          </div>
          <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(57,197,187,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Icon name="refresh" fontSize={18} />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Icon name="create_new_folder" fontSize={18} />
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button
            onClick={() => setIsGridView(!isGridView)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isGridView
                ? "text-gray-400 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5"
                : "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10"
            }`}
          >
            <Icon name={isGridView ? "grid_view" : "view_list"} fontSize={18} />
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-full text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all ml-1">
            <Icon name="upload" fontSize={16} />
            {t("drive.uploadFiles")}
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 px-4 py-2 shrink-0">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id} className="flex items-center gap-1.5">
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[13px] font-bold transition-colors ${
                index === breadcrumbs.length - 1
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
              }`}
            >
              {index === 0 && <Icon name="cloud" fontSize={14} className={index === breadcrumbs.length - 1 ? "text-cyan-500" : "text-gray-400"} />}
              {index > 0 && <Icon name="folder" fontSize={14} className={index === breadcrumbs.length - 1 ? "text-cyan-500" : "text-gray-400"} />}
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 && (
              <Icon name="chevron_right" fontSize={16} className="text-gray-300 dark:text-gray-700" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {!isGridView ? (
          /* List View */
          <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100/80 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider sticky top-0 z-10">
              <div className="col-span-12 md:col-span-6 flex items-center">
                {t("drive.name")}
                <Icon name="arrow_drop_down" fontSize={16} className="ml-1" />
              </div>
              <div className="col-span-3 hidden md:block">{t("drive.modifiedDate")}</div>
              <div className="col-span-2 hidden md:block text-right pr-4">{t("drive.size")}</div>
              <div className="col-span-1 hidden md:block" />
            </div>

            {/* Items */}
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/30">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                >
                  <div className="col-span-12 md:col-span-6 flex items-center gap-4 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        item.type === "folder"
                          ? "bg-cyan-50 dark:bg-cyan-500/10"
                          : "bg-gray-100 dark:bg-gray-700/50 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10"
                      }`}
                    >
                      <Icon
                        name={item.type === "folder" ? "folder" : "draft"}
                        fontSize={20}
                        className={`transition-colors ${
                          item.type === "folder"
                            ? "text-cyan-500 dark:text-cyan-400"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-cyan-500"
                        }`}
                      />
                    </div>
                    <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <div className="col-span-3 hidden md:block text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                    {format(item.modifiedAt, "yyyy-MM-dd HH:mm")}
                  </div>
                  <div className="col-span-2 hidden md:block text-right pr-4 text-[13px] font-bold text-gray-500 dark:text-gray-400">
                    {formatBytes(item.sizeMB, "MB")}
                  </div>
                  <div className="col-span-1 hidden md:flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors">
                      <Icon name="more_vert" fontSize={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer group overflow-hidden"
              >
                <div
                  className={`h-28 flex items-center justify-center border-b border-gray-100/80 dark:border-gray-700/50 transition-colors ${
                    item.type === "folder"
                      ? "bg-cyan-50/30 dark:bg-gray-900/40 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10"
                      : "bg-gray-50 dark:bg-gray-900/40 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10"
                  }`}
                >
                  <Icon
                    name={item.type === "folder" ? "folder" : "draft"}
                    fontSize={40}
                    className={`transition-all group-hover:scale-110 duration-500 ${
                      item.type === "folder"
                        ? "text-cyan-400"
                        : "text-gray-300 dark:text-gray-600 group-hover:text-cyan-500"
                    }`}
                  />
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.name}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                    <span>{format(item.modifiedAt, "MM-dd")}</span>
                    <span>{formatBytes(item.sizeMB, "MB")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
