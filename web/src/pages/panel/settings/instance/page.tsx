"use client";

import { Icon } from "@/components/ui/Icon";

const instanceInfo = [
  { key: "实例名称", value: "Asagity", description: "实例的显示名称" },
  { key: "版本", value: "1.0.0-beta.39", description: "当前运行版本" },
  { key: "描述", value: "Asagity 联邦社区实例", description: "实例简介" },
  { key: "活跃用户", value: "1,240", description: "30天内活跃用户数" },
  { key: "总帖子", value: "85,420", description: "所有帖子总数" },
  { key: "创建时间", value: "2024-01-15", description: "实例创建日期" },
];

export default function PanelSettingsInstancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon name="info" className="text-cyan-500" fontSize={24} />
        <h2 className="text-xl font-black text-gray-900 dark:text-white">实例信息</h2>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm overflow-hidden">
        {instanceInfo.map((item, i) => (
          <div
            key={item.key}
            className={`px-6 py-4 flex items-start justify-between group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
              i < instanceInfo.length - 1 ? "border-b border-gray-100/50 dark:border-gray-800/50" : ""
            }`}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{item.key}</span>
              <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">{item.description}</span>
            </div>
            <div className="max-w-[200px] text-right">
              <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400 break-all">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
