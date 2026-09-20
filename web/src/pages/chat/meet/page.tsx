"use client";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export default function ChatMeetPage() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-[fadeIn_0.3s_ease-out]">
      <div className="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        <Icon name="videocam" className="text-cyan-500" fontSize={48} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide mb-2">
        Asagity Meet
      </h2>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
        {t("chat.meetPlaceholder")}
      </p>
    </div>
  );
}
