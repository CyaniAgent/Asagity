"use client";

import { useRouter } from "next/navigation";
import { useThemeStore } from "@/stores/theme";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const userData = days.map((day, i) => ({
  day,
  users: [120, 135, 128, 142, 156, 168, 175][i],
}));

const notesData = days.map((day, i) => ({
  day,
  notes: [480, 520, 600, 550, 720, 850, 910][i],
}));

const federationData = days.map((day, i) => ({
  day,
  requests: [210, 240, 280, 310, 390, 420, 480][i],
}));

export default function AboutChartsPage() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { t } = useI18n();

  const textColor = isDark ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark ? "#374151" : "#E5E7EB";
  const tooltipBg = isDark ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.95)";
  const tooltipBorder = isDark ? "rgba(55,65,81,0.5)" : "rgba(229,231,235,0.5)";
  const tooltipText = isDark ? "#fff" : "#111827";

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
              <Icon name="dashboard" className="text-cyan-500" fontSize={24} />
              {t("about.charts")}
            </h1>
            <button
              onClick={() => router.push("/about")}
              className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t("about.backToOverview")}
            </button>
          </div>
          <p className="text-xs text-gray-500">7-Day Aggregation</p>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">{t("about.userGrowth")}</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userData}>
                <defs>
                  <linearGradient id="gradientUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39C5BB" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#39C5BB" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                <YAxis tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: 12,
                    padding: "8px 12px",
                  }}
                />
                <Area type="monotone" dataKey="users" name={t("about.userCount")} stroke="#39C5BB" strokeWidth={3} fill="url(#gradientUsers)" dot={{ r: 4, fill: "#39C5BB", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notes Activity Chart */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">{t("about.postActivity")}</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={notesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                <YAxis tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: 12,
                    padding: "8px 12px",
                  }}
                />
                <Bar dataKey="notes" name={t("about.postCount")} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Federation Requests Chart */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">{t("about.federationRequests")}</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={federationData}>
                <defs>
                  <linearGradient id="gradientFed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                <YAxis tick={{ fill: textColor, fontWeight: 700, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: 12,
                    padding: "8px 12px",
                  }}
                />
                <Area type="monotone" dataKey="requests" name={t("about.requestCount")} stroke="#f59e0b" strokeWidth={3} fill="url(#gradientFed)" dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
