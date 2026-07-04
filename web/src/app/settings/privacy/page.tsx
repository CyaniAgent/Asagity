"use client";

import { useState } from "react";
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

export default function PrivacySettingsPage() {
  const { t } = useI18n();
  const [defaultVisibility, setDefaultVisibility] = useState("public");
  const [whoCanFollow, setWhoCanFollow] = useState("everyone");
  const [whoCanReply, setWhoCanReply] = useState("everyone");
  const [showOnline, setShowOnline] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [markSensitive, setMarkSensitive] = useState(false);

  const visibilityOptions = [
    { value: "public", label: t("settings.public"), desc: t("settings.visibleToEveryone"), icon: "public" },
    { value: "unlisted", label: t("settings.unlisted"), desc: t("settings.notInTimeline"), icon: "visibility_off" },
    { value: "followers", label: t("settings.followersOnly"), desc: t("settings.visibleToFollowers"), icon: "group" },
    { value: "direct", label: t("settings.direct"), desc: t("settings.visibleToSpecified"), icon: "mail" },
  ];

  const followOptions = [
    { value: "everyone", label: t("settings.everyone") },
    { value: "approved", label: t("settings.needsApproval") },
    { value: "nobody", label: t("settings.noFollow") },
  ];

  const replyOptions = [
    { value: "everyone", label: t("settings.everyone") },
    { value: "mentioned", label: t("settings.mentionedOnly") },
    { value: "followers", label: t("settings.followersOnly") },
    { value: "none", label: t("settings.noReply") },
  ];

  return (
    <div className="max-w-[700px] mx-auto p-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="shield" className="text-white" fontSize={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.privacySecurity")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.protectAccount")}</p>
        </div>
      </div>

      {/* Default Post Visibility */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="public" className="text-cyan-500" fontSize={18} />
            {t("settings.defaultPostVisibility")}
          </h2>
        </div>
        <div className="p-4 space-y-2">
          {visibilityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDefaultVisibility(opt.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                defaultVisibility === opt.value
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10"
                  : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
              }`}
            >
              <Icon
                name={opt.icon}
                className={defaultVisibility === opt.value ? "text-cyan-500" : "text-gray-400"}
                fontSize={20}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{opt.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</div>
              </div>
              {defaultVisibility === opt.value && (
                <Icon name="check_circle" className="text-cyan-500" fontSize={20} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Who Can Follow / Reply */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="group" className="text-cyan-500" fontSize={18} />
            {t("settings.interactionPermissions")}
          </h2>
        </div>
        <div className="p-4 space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">{t("settings.whoCanFollow")}</label>
            <div className="flex gap-2">
              {followOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setWhoCanFollow(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    whoCanFollow === opt.value
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                      : "border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">{t("settings.whoCanReply")}</label>
            <div className="flex gap-2 flex-wrap">
              {replyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setWhoCanReply(opt.value)}
                  className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    whoCanReply === opt.value
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                      : "border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Visibility Toggles */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="visibility" className="text-cyan-500" fontSize={18} />
            {t("settings.visibilitySettings")}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.showOnlineStatus")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.allowOthersToSeeOnline")}</div>
            </div>
            <Toggle enabled={showOnline} onChange={setShowOnline} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.showActivityStatus")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.allowOthersToSeeActivity")}</div>
            </div>
            <Toggle enabled={showActivity} onChange={setShowActivity} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.sensitiveContent")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.defaultSensitiveLabel")}</div>
            </div>
            <Toggle enabled={markSensitive} onChange={setMarkSensitive} />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="lock" className="text-cyan-500" fontSize={18} />
            {t("settings.accountSecurity")}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.twoFactorAuth")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.twoFactorDesc")}</div>
            </div>
            <Toggle enabled={twoFactor} onChange={setTwoFactor} />
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
            <Icon name="key" fontSize={18} />
            {t("settings.changePassword")}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
            <Icon name="block" fontSize={18} />
            {t("settings.blockedUsers")}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
            <Icon name="volume_off" fontSize={18} />
            {t("settings.mutedUsers")}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
            <Icon name="filter_list" fontSize={18} />
            {t("settings.filteredKeywords")}
          </button>
        </div>
      </section>

      {/* Data & Privacy */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="storage" className="text-cyan-500" fontSize={18} />
            {t("settings.dataPrivacy")}
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
            <Icon name="download" fontSize={18} />
            {t("settings.exportData")}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
            <Icon name="delete_forever" fontSize={18} />
            {t("settings.deleteAccount")}
          </button>
        </div>
      </section>
    </div>
  );
}
