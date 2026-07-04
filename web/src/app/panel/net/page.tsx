"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

const mockNodes = [
  { id: "1", name: "mastodon.social", status: "online", latency: "45ms", users: 850000 },
  { id: "2", name: "fedibird.com", status: "online", latency: "62ms", users: 120000 },
  { id: "3", name: "misskey.io", status: "online", latency: "38ms", users: 45000 },
  { id: "4", name: "calckey.social", status: "offline", latency: "-", users: 8000 },
];

export default function PanelNetPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <Icon name="globe" className="text-cyan-500" fontSize={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Asagity NET</h1>
          <p className="text-xs font-bold text-gray-500">{t("panel.federationNetworkTopology")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockNodes.map((node) => (
          <div key={node.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-md transition-all text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-3 text-white font-black text-xl shadow-lg shadow-cyan-500/20">
              {node.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">{node.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${node.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs font-bold text-gray-500">{node.status}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("panel.latency")} {node.latency}</p>
            <p className="text-xs text-gray-500">{(node.users / 1000).toFixed(0)}K {t("panel.totalUsers")}</p>
          </div>
        ))}
      </div>

      {/* Network Stats */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm">
        <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">{t("panel.networkStatistics")}</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-2xl font-black text-cyan-500">4</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.connectedInstances")}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-2xl font-black text-green-500">3</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.online")}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-2xl font-black text-amber-500">1.2K</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.federationRequestsToday")}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-2xl font-black text-purple-500">48ms</p>
            <p className="text-xs font-bold text-gray-500">{t("panel.averageLatency")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
