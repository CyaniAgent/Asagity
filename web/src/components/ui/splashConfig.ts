/**
 * Splash 风味文案配置
 *
 * 开屏进度条下方随机抽取一条展示（每次开屏只抽一次）。
 * 未来将开放用户设置项覆盖此默认列表——届时仅需在配置层替换数组来源，
 * SplashScreen 与 i18n key 结构保持不变。
 *
 * i18n key 约定：splash.messageXxx（四语言已就位）。
 */
export const SPLASH_MESSAGE_KEYS = [
  "splash.messageCoffee",
  "splash.messageSns",
  "splash.messageAlmost",
] as const;

export type SplashMessageKey = (typeof SPLASH_MESSAGE_KEYS)[number];

/** 每次开屏随机抽取一条风味文案 key。 */
export function pickSplashMessageKey(): SplashMessageKey {
  return SPLASH_MESSAGE_KEYS[Math.floor(Math.random() * SPLASH_MESSAGE_KEYS.length)];
}
