"use client";

import { Icon } from "@/components/ui/Icon";

export default function PanelSettingsStoragePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon name="cloud" className="text-cyan-500" fontSize={24} />
        <h2 className="text-xl font-black text-gray-900 dark:text-white">对象存储 (S3)</h2>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Bucket 名称</label>
            <input type="text" placeholder="asagity-drive" className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">端点</label>
            <input type="text" placeholder="https://s3.amazonaws.com" className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Access Key</label>
            <input type="password" placeholder="••••••••" className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Secret Key</label>
            <input type="password" placeholder="••••••••" className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">区域</label>
            <input type="text" placeholder="us-east-1" className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">公共 URL</label>
            <input type="text" placeholder="https://drive.asagity.net" className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="px-4 py-2 rounded-2xl text-sm font-bold bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">
            保存配置
          </button>
          <button className="px-4 py-2 rounded-2xl text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            测试连接
          </button>
        </div>
      </div>
    </div>
  );
}
