"use client";

import { useThemeStore, resolveMode, resolveModeLabel } from "@/stores/theme";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/** 主题切换钮（搬运自旧 MainLayout） */
export function ThemeToggle() {
  const { t } = useI18n();
  const isDark = useThemeStore((s) => resolveMode(s.preference, s.systemPreference) === "dark");
  const modeLabel = useThemeStore((s) => resolveModeLabel(s.preference));
  const preference = useThemeStore((s) => s.preference);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center h-8 px-2 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-sm hover:scale-105 transition-transform"
      title={`${t("header.current")}${modeLabel}`}
    >
      <span className={isDark ? "text-cyan-400" : "text-yellow-500"}>
        <Icon name={preference === "dark" ? "dark_mode" : preference === "light" ? "light_mode" : "settings_brightness"} fontSize={16} />
      </span>
    </button>
  );
}
