"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export default function TopicCreatePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!topicName.trim()) return;
    setIsSubmitting(true);
    // TODO: Call API to create topic
    submitTimerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      router.push("/topic");
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Icon name="arrow_left" fontSize={18} />
        </button>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{t("topic.createTopic")}</h2>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-[600px] mx-auto bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
          <div className="p-6 space-y-5">
            {/* Topic Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t("topic.topicName")} <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500 transition-all overflow-hidden">
                <span className="pl-4 pr-2 py-3 text-gray-400 font-bold select-none">#</span>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder={t("topic.enterTopicName")}
                  className="flex-1 py-3 pr-4 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                {t("topic.nameValidation")}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t("topic.topicDescription")}</label>
              <textarea
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                rows={4}
                placeholder={t("topic.describeTopic")}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm resize-none placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("topic.visibility")}</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    isPublic
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon name="public" className={isPublic ? "text-cyan-500" : "text-gray-400"} fontSize={20} />
                  <div className="text-left">
                    <span className="block font-bold text-sm text-gray-900 dark:text-white">{t("topic.public")}</span>
                    <span className="block text-xs text-gray-500">{t("topic.visibleToAll")}</span>
                  </div>
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    !isPublic
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon name="lock" className={!isPublic ? "text-cyan-500" : "text-gray-400"} fontSize={20} />
                  <div className="text-left">
                    <span className="block font-bold text-sm text-gray-900 dark:text-white">{t("topic.private")}</span>
                    <span className="block text-xs text-gray-500">{t("topic.onlyVisibleToYou")}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
            <button
              onClick={handleSubmit}
              disabled={!topicName.trim() || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-full text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <Icon name="refresh" className="animate-spin" fontSize={16} />
              ) : (
                <Icon name="add" fontSize={16} />
              )}
              {t("topic.createTopic")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
