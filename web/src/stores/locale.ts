import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "zh-CN" | "zh-TW" | "en-US" | "ja-JP";

export const localeNames: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "en-US": "English",
  "ja-JP": "日本語",
};

export const locales: Locale[] = ["zh-CN", "zh-TW", "en-US", "ja-JP"];

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "zh-CN",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "asagity-locale",
    }
  )
);
