"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useI18n } from "@/components/providers/I18nProvider";

export default function DeveloperPage() {
  const router = useRouter();
  const freeWindowStore = useFreeWindowStore();
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-[fadeIn_0.3s_ease-out]">
      <div className="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        <Icon name="terminal" className="text-cyan-500" fontSize={48} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide mb-2">
        {t("pages.developer")}
      </h2>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-6">
        {t("pages.developerDescription")}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => freeWindowStore.openTermity()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/25"
        >
          <Icon name="terminal" fontSize={18} />
          {t("pages.openTerminal")}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {t("common.back")}
        </button>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 max-w-md">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-bold text-cyan-500">Termity</span> — {t("pages.recoveryShell")}
          <br />
          {t("pages.helpHint")}
        </p>
      </div>
    </div>
  );
}
