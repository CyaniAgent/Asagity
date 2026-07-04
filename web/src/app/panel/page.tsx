"use client";

import { useThemeStore } from "@/stores/theme";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function PanelPage() {
  const { isDark } = useThemeStore();
  const { t } = useI18n();

  const metrics = [
    { label: t("panel.totalUsers"), value: "12,482", diff: "+124 (24h)", icon: "group", color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: t("panel.activeSessions"), value: "1,208", diff: t("panel.peakUsers"), icon: "sync", color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: t("panel.storageUsed"), value: "42.5 TB", diff: t("panel.remainingStorage"), icon: "cloud", color: "text-cyan-600", bg: "bg-cyan-600/10" },
    { label: t("panel.uptime"), value: t("panel.uptimeDays"), diff: t("panel.systemHealthy"), icon: "server", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const trafficData = days.map((day, i) => ({
    day,
    local: [480, 520, 600, 550, 720, 850, 910][i],
    fed: [210, 240, 280, 310, 390, 420, 480][i],
  }));

  const storageData = [
    { name: t("panel.media"), value: 1048, color: "#39C5BB" },
    { name: t("panel.drive"), value: 735, color: "#0ea5e9" },
    { name: t("panel.database"), value: 580, color: "#8b5cf6" },
    { name: t("panel.cache"), value: 300, color: "#f59e0b" },
  ];

  const adminLogs = [
    { time: "10 mins ago", action: "新实例加入联邦网: mastodon.social", type: "info" as const },
    { time: "1 hour ago", action: "封禁恶意账户: @spambot_001", type: "warn" as const },
    { time: "3 hours ago", action: "核心系统升级 v2.4.0 完成", type: "success" as const },
    { time: "Yesterday", action: "数据库自动备份完成", type: "info" as const },
  ];

  const textColor = isDark ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark ? "#374151" : "#E5E7EB";
  const tooltipBg = isDark ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.95)";
  const tooltipBorder = isDark ? "rgba(55,65,81,0.5)" : "rgba(229,231,235,0.5)";
  const tooltipText = isDark ? "#fff" : "#111827";

  return (
    <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out] pb-10 px-2 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Icon name="dashboard" className="text-cyan-500" fontSize={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-wide">
              {t("panel.systemOverview")}
            </h1>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
              Asagity Backend Matrix • All Systems Go
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Icon name="download" fontSize={16} />
            <span className="hidden md:inline">{t("panel.exportLogs")}</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-cyan-500 text-white shadow-md shadow-cyan-500/20 flex items-center justify-center hover:bg-cyan-600 transition-colors">
            <Icon name="refresh" fontSize={18} />
          </button>
        </div>
      </div>

      {/* Stratum I: Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-md transition-shadow group cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.bg}`}>
                <Icon name={m.icon} className={m.color} fontSize={20} />
              </div>
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-900/50 px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-800">
                {m.diff}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-gray-900 dark:text-white mb-1 group-hover:scale-105 origin-left transition-transform duration-300">
                {m.value}
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stratum II: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Area Chart */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h3 className="font-black text-lg text-gray-900 dark:text-white">
                {t("panel.networkTrafficAndScheduling")}
              </h3>
              <span className="text-xs font-bold text-gray-500">{t("panel.sevenDayAggregation")}</span>
            </div>
            <select className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-cyan-500">
              <option>{t("panel.last7Days")}</option>
              <option>{t("panel.last30Days")}</option>
              <option>{t("panel.thisYear")}</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="gradientLocal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39C5BB" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#39C5BB" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradientFed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: 16,
                    padding: "12px 16px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="local"
                  name={t("panel.localRequests")}
                  stroke="#39C5BB"
                  strokeWidth={3}
                  fill="url(#gradientLocal)"
                  dot={{ r: 5, fill: "#39C5BB", strokeWidth: 2, stroke: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="fed"
                  name={t("panel.federationSync")}
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#gradientFed)"
                  dot={{ r: 5, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage Pie Chart */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">
            {t("panel.storageDistribution")}
          </h3>
          <span className="text-xs font-bold text-gray-500 mb-6">{t("panel.volumeAnalysis")}</span>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {storageData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: 12,
                    padding: "8px 12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs font-bold" style={{ color: textColor }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stratum III: System Pulse & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Log */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="history" className="text-indigo-500" fontSize={20} />
              {t("panel.systemLogs")}
            </h3>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline">{t("panel.viewAll")}</span>
          </div>
          <div className="flex flex-col gap-4 relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
            {adminLogs.map((log, i) => (
              <div key={i} className="flex gap-4 relative z-10 w-full">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[3px] border-white dark:border-gray-900 ${
                    log.type === "info" ? "bg-cyan-100 text-cyan-500" :
                    log.type === "warn" ? "bg-amber-100 text-amber-500" :
                    "bg-green-100 text-green-500"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      log.type === "info" ? "bg-cyan-500" :
                      log.type === "warn" ? "bg-amber-500" :
                      "bg-green-500"
                    }`}
                  />
                </div>
                <div className="flex flex-col bg-white/50 dark:bg-gray-800/30 rounded-2xl px-4 py-2 flex-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{log.action}</span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware Pulse */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6 flex flex-col">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Icon name="server" className="text-fuchsia-500" fontSize={20} />
            {t("panel.hardwarePulse")}
          </h3>
          <div className="flex flex-col gap-6 flex-1 justify-center">
            {/* CPU */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">CPU Load (16 Cores)</span>
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">12%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full w-[12%] animate-pulse" />
              </div>
            </div>
            {/* RAM */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Memory Used (32GB)</span>
                <span className="text-xs font-black text-fuchsia-500 dark:text-fuchsia-400">45%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-fuchsia-400 to-fuchsia-500 rounded-full w-[45%]" />
              </div>
            </div>
            {/* Disk I/O */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Disk I/O (NVMe)</span>
                <span className="text-xs font-black text-emerald-500 dark:text-emerald-400">3 MB/s</span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-[8%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
