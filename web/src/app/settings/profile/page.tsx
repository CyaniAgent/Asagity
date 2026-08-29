"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useUserStore } from "@/stores/user";
import { useSystemStore } from "@/stores/system";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export default function ProfileSettingsPage() {
  const { t } = useI18n();
  const userStore = useUserStore();
  const systemStore = useSystemStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [nickname, setNickname] = useState(userStore.user?.name || "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [language, setLanguage] = useState("简体中文");
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleSave = () => {
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    if (systemStore.isDevMode) return;
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await userStore.logoutAll();
    } catch {
      // silently fail
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[700px] mx-auto p-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="person" className="text-white" fontSize={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.personalProfile")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.manageProfile")}</p>
        </div>
      </div>

      {/* Avatar & Banner */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Avatar */}
        <div className="relative group w-full sm:w-40 shrink-0 flex flex-col items-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-gray-800 shadow-lg">
            {userStore.avatar ? (
              <Image src={userStore.avatar} width={96} height={96} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
                <Icon name="person" className="text-cyan-500" fontSize={36} />
              </div>
            )}
          </div>
          <button className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full text-xs font-semibold hover:bg-cyan-500/20 transition-colors">
            <Icon name="photo_camera" fontSize={14} />
            {t("settings.changeAvatar")}
          </button>
        </div>

        {/* Banner */}
        <div className="flex-1 relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[140px] group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-teal-400/20" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
            <span className="opacity-0 group-hover:opacity-100 flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-900/90 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all shadow-lg">
              <Icon name="image" fontSize={16} />
              {t("settings.changeBanner")}
            </span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Nickname */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t("settings.nickname")} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("settings.enterNickname")}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t("settings.bio")}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("settings.bioPlaceholder")}
            rows={4}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 px-1">
            {t("settings.bioHint")}
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t("settings.location")}
          </label>
          <div className="relative">
            <Icon name="location_on" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fontSize={18} />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("settings.yourLocation")}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t("settings.birthday")}
          </label>
          <div className="relative">
            <Icon name="cake" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fontSize={18} />
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t("settings.language")}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all appearance-none"
          >
            <option>{t("settings.autoFollowBrowser")}</option>
            <option>简体中文</option>
            <option>English</option>
            <option>日本語</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
          saved
            ? "bg-green-500 text-white"
            : "bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01]"
        }`}
      >
        {saved ? t("settings.saved") : t("settings.saveChanges")}
      </button>

      {/* Account Actions */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          {t("settings.accountManagement")}
        </h3>
        <button
          onClick={handleClearCache}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <Icon name="delete" fontSize={18} />
          {t("settings.clearLocalCache")}
        </button>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all active:scale-95"
        >
          {isLoggingOut ? (
            <Icon name="refresh" className="animate-spin" fontSize={16} />
          ) : (
            <Icon name="power_settings_new" fontSize={16} />
          )}
          {t("settings.logoutAccount")}
        </button>
      </div>
    </div>
  );
}
