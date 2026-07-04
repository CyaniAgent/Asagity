"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const federatedInstances = [
  { name: "Mastodon Social", domain: "mastodon.social", status: "online", users: 850000, software: "Mastodon" },
  { name: "Pixiv Fed", domain: "fedibird.com", status: "online", users: 120000, software: "Mastodon" },
  { name: "Misskey Hub", domain: "misskey.io", status: "online", users: 45000, software: "Misskey" },
];

export default function AboutFederationPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="h-full flex flex-col items-center p-8 relative overflow-y-auto">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="globe" className="text-cyan-500" fontSize={24} />
              {t("about.federatedInstances")}
            </h1>
            <button
              onClick={() => router.push("/about")}
              className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t("about.backToOverview")}
            </button>
          </div>
          <p className="text-xs text-gray-500">{federatedInstances.length} federated instances</p>
        </div>

        {/* Instance List */}
        <div className="flex flex-col gap-4">
          {federatedInstances.map((instance) => (
            <div key={instance.domain} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
                    {instance.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {instance.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-500">{instance.domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-bold text-gray-500">{t("about.online")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-lg font-black text-gray-900 dark:text-white">{(instance.users / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] font-bold text-gray-500">{t("about.users")}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-lg font-black text-gray-900 dark:text-white">{instance.software}</p>
                  <p className="text-[10px] font-bold text-gray-500">{t("about.software")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
