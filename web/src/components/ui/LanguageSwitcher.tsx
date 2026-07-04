"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { locales, localeNames } from "@/stores/locale";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            locale === l
              ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          title={localeNames[l]}
        >
          {l.split("-")[0].toUpperCase()}
        </button>
      ))}
    </div>
  );
}
