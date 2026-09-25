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

export default function NotificationsSettingsPage() {
  const { t } = useI18n();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [replyNotif, setReplyNotif] = useState(true);
  const [mentionNotif, setMentionNotif] = useState(true);
  const [followNotif, setFollowNotif] = useState(true);
  const [repostNotif, setRepostNotif] = useState(true);
  const [reactionNotif, setReactionNotif] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="max-w-[700px] mx-auto p-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="notifications" className="text-white" fontSize={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.notifications")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.manageNotifications")}</p>
        </div>
      </div>

      {/* Delivery Methods */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="send" className="text-cyan-500" fontSize={18} />
            {t("settings.deliveryMethods")}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.browserPush")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.browserPushDesc")}</div>
            </div>
            <Toggle enabled={pushEnabled} onChange={setPushEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.emailNotifications")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.emailNotificationsDesc")}</div>
            </div>
            <Toggle enabled={emailEnabled} onChange={setEmailEnabled} />
          </div>
        </div>
      </section>

      {/* Notification Types */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="tune" className="text-cyan-500" fontSize={18} />
            {t("settings.notificationTypes")}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="reply" className="text-cyan-500" fontSize={18} />
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.reply")}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.replyDesc")}</div>
              </div>
            </div>
            <Toggle enabled={replyNotif} onChange={setReplyNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="alternate_email" className="text-cyan-500" fontSize={18} />
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.mention")}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.mentionDesc")}</div>
              </div>
            </div>
            <Toggle enabled={mentionNotif} onChange={setMentionNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="person_add" className="text-cyan-500" fontSize={18} />
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.newFollowers")}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.newFollowersDesc")}</div>
              </div>
            </div>
            <Toggle enabled={followNotif} onChange={setFollowNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="repeat" className="text-cyan-500" fontSize={18} />
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.repost")}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.repostDesc")}</div>
              </div>
            </div>
            <Toggle enabled={repostNotif} onChange={setRepostNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="add_reaction" className="text-cyan-500" fontSize={18} />
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.reaction")}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.reactionDesc")}</div>
              </div>
            </div>
            <Toggle enabled={reactionNotif} onChange={setReactionNotif} />
          </div>
        </div>
      </section>

      {/* Sound */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="volume_up" className="text-cyan-500" fontSize={18} />
            {t("settings.notificationSound")}
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.notificationTone")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.notificationToneDesc")}</div>
            </div>
            <Toggle enabled={soundEnabled} onChange={setSoundEnabled} />
          </div>
        </div>
      </section>

      {/* Muted Keywords */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="filter_list" className="text-cyan-500" fontSize={18} />
            {t("settings.mutedKeywords")}
          </h2>
        </div>
        <div className="p-4">
          <div className="text-center text-gray-400 py-6">
            <Icon name="add" className="mx-auto mb-2 opacity-30" fontSize={32} />
            <p className="text-sm">{t("settings.noMutedKeywords")}</p>
            <button className="mt-2 px-4 py-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs font-semibold hover:bg-cyan-500/20 transition-colors">
              {t("settings.addKeyword")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
