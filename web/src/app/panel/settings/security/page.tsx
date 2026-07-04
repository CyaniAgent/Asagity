"use client";

import { Icon } from "@/components/ui/Icon";

const captchaProviders = [
  { name: "hCaptcha", enabled: true },
  { name: "Turnstile", enabled: false },
  { name: "reCAPTCHA", enabled: false },
];

export default function PanelSettingsSecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon name="lock" className="text-cyan-500" fontSize={24} />
        <h2 className="text-xl font-black text-gray-900 dark:text-white">安全与 CAPTCHA</h2>
      </div>

      {/* CAPTCHA */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6">
        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">CAPTCHA 提供商</h3>
        <div className="flex flex-col gap-3">
          {captchaProviders.map((p) => (
            <div key={p.name} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</span>
              <div className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${p.enabled ? "bg-cyan-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-transform ${p.enabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6">
        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">API 速率限制</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">请求限制 (每分钟)</label>
            <input type="number" defaultValue={60} className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">上传限制 (每小时)</label>
            <input type="number" defaultValue={30} className="px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
        </div>
        <button className="px-4 py-2 rounded-2xl text-sm font-bold bg-cyan-500 text-white hover:bg-cyan-600 transition-colors mt-6">
          保存设置
        </button>
      </div>
    </div>
  );
}
