"use client";

import { useEffect, useState, createContext, useContext, useCallback, useMemo } from "react";
import { useLocaleStore, type Locale } from "@/stores/locale";
import type { Messages } from "next-intl";

const messageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  "zh-CN": () => import("@/messages/zh-CN.json"),
  "zh-TW": () => import("@/messages/zh-TW.json"),
  "en-US": () => import("@/messages/en-US.json"),
  "ja-JP": () => import("@/messages/ja-JP.json"),
};

const messagesCache = {} as Record<Locale, Messages>;

interface I18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  locale: "zh-CN",
  setLocale: () => {},
  isLoading: true,
});

export function useI18n() {
  return useContext(I18nContext);
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (messagesCache[locale]) {
        if (!cancelled) {
          setMessages(messagesCache[locale] as Record<string, unknown>);
          setIsLoading(false);
        }
        return;
      }

      try {
        const loader = messageLoaders[locale];
        if (!loader) throw new Error(`No loader for locale: ${locale}`);
        const mod = await loader();
        messagesCache[locale] = mod.default;
        if (!cancelled) {
          setMessages(mod.default as Record<string, unknown>);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Failed to load messages for ${locale}:`, error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMessages();
    return () => { cancelled = true; };
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(messages, key);
      if (value === undefined) return key;

      if (params) {
        return Object.entries(params).reduce(
          (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
          value
        );
      }

      return value;
    },
    [messages]
  );

  const value = useMemo(
    () => ({ t, locale, setLocale, isLoading }),
    [t, locale, setLocale, isLoading]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
