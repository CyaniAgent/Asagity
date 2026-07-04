"use client";

import { Icon } from "@/components/ui/Icon";

const moderationSettings = [
  { label: "注册控制", description: "允许新用户注册", enabled: true },
  { label: "邮箱验证", description: "注册时要求邮箱验证", enabled: false },
  { label: "敏感词过滤", description: "自动过滤帖子中的敏感词", enabled: true },
  { label: "隐藏标签", description: "隐藏特定标签的内容", enabled: false },
  { label: "保留用户名", description: "防止用户使用保留的用户名", enabled: true },
];

const blockedHosts = ["spam-bot.xyz", "malicious-instance.net", "bot-farm.io"];

export default function PanelSettingsModerationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon name="shield" className="text-cyan-500" fontSize={24} />
        <h2 className="text-xl font-black text-gray-900 dark:text-white">审核设置</h2>
      </div>

      {/* Toggle Settings */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm overflow-hidden">
        {moderationSettings.map((item, i) => (
          <div
            key={item.label}
            className={`px-6 py-4 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
              i < moderationSettings.length - 1 ? "border-b border-gray-100/50 dark:border-gray-800/50" : ""
            }`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</span>
              <span className="text-xs text-gray-500">{item.description}</span>
            </div>
            <div className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${item.enabled ? "bg-cyan-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-transform ${item.enabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Blocked Hosts */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg text-gray-900 dark:text-white">封禁主机</h3>
          <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors flex items-center gap-1">
            <Icon name="add" fontSize={14} />
            添加
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {blockedHosts.map((host) => (
            <div key={host} className="flex items-center justify-between px-4 py-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200/50 dark:border-red-800/30">
              <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">{host}</span>
              <button className="text-gray-400 hover:text-red-500 transition-colors">
                <Icon name="close" fontSize={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
