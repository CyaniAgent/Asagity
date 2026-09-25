/**
 * i18n 配置
 *
 * 纯客户端配置，不依赖 next-intl。
 * locale 管理由 Zustand store (@/stores/locale) 处理。
 */

export const locales = ["zh-CN", "zh-TW", "en-US", "ja-JP"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-CN";

export const localeNames: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "en-US": "English",
  "ja-JP": "日本語",
};
