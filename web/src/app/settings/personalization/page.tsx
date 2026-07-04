"use client";

import { useState } from "react";
import { useThemeStore } from "@/stores/theme";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-cyan-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

export default function PersonalizationSettingsPage() {
  const { t } = useI18n();
  const themeStore = useThemeStore();
  const [wallpaperIntensity, setWallpaperIntensity] = useState(50);
  const [pageTransitions, setPageTransitions] = useState(true);
  const [musicVisual, setMusicVisual] = useState(true);
  const [notifAnimation, setNotifAnimation] = useState(true);

  const themeOptions = [
    { value: "system" as const, label: t("settings.followSystem"), desc: t("settings.followSystemDesc"), icon: "settings_brightness" },
    { value: "light" as const, label: t("settings.lightMode"), desc: t("settings.lightModeDesc"), icon: "light_mode" },
    { value: "dark" as const, label: t("settings.darkMode"), desc: t("settings.darkModeDesc"), icon: "dark_mode" },
  ];

  const wallpapers = [
    { id: "default", name: t("settings.default") },
    { id: "gradients", name: t("settings.gradients") },
    { id: "miku", name: t("settings.miku") },
  ];

  return (
    <div className="max-w-[700px] mx-auto p-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="palette" className="text-white" fontSize={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.personalization")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.customizeAppearance")}</p>
        </div>
      </div>

      {/* Theme Selection */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="palette" className="text-cyan-500" fontSize={18} />
            {t("settings.theme")}
          </h2>
        </div>
        <div className="p-4 space-y-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => themeStore.setPreference(opt.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                themeStore.preference === opt.value
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 shadow-[0_0_15px_rgba(57,197,187,0.15)]"
                  : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  themeStore.preference === opt.value
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon name={opt.icon} fontSize={20} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{opt.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</div>
              </div>
              {themeStore.preference === opt.value && (
                <Icon name="check_circle" className="text-cyan-500" fontSize={20} />
              )}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="px-5 pb-5">
          <div className={`rounded-2xl border border-gray-100 dark:border-gray-800 p-4 ${themeStore.isDark ? "bg-gray-800/50" : "bg-gray-50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${themeStore.isDark ? "bg-gray-700" : "bg-white"}`}>
                <Icon name="bolt" className="text-cyan-500" fontSize={20} />
              </div>
              <div>
                <div className={`text-sm font-bold ${themeStore.isDark ? "text-white" : "text-gray-900"}`}>Asagity</div>
                <div className={`text-xs ${themeStore.isDark ? "text-gray-400" : "text-gray-500"}`}>{themeStore.modeLabel} · {t("settings.previewEffect")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallpaper */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="image" className="text-cyan-500" fontSize={18} />
            {t("settings.wallpaper")}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {wallpapers.map((wp) => (
              <button
                key={wp.id}
                className="aspect-video rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:scale-[1.02] transition-all bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
              >
                <span className="text-xs text-gray-400 dark:text-gray-500">{wp.name}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.wallpaperIntensity")}</label>
              <span className="text-xs font-bold text-cyan-500">{wallpaperIntensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={wallpaperIntensity}
              onChange={(e) => setWallpaperIntensity(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* Animation Settings */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="animation" className="text-cyan-500" fontSize={18} />
            {t("settings.animations")}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.pageTransitions")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.pageTransitionsDesc")}</div>
            </div>
            <Toggle enabled={pageTransitions} onChange={setPageTransitions} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.musicVisualization")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.musicVisualizationDesc")}</div>
            </div>
            <Toggle enabled={musicVisual} onChange={setMusicVisual} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.notificationAnimation")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.notificationAnimationDesc")}</div>
            </div>
            <Toggle enabled={notifAnimation} onChange={setNotifAnimation} />
          </div>
        </div>
      </section>
    </div>
  );
}
