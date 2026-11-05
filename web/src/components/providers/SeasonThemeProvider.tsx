"use client";

import { useEffect, type ReactNode } from "react";
import { Theme } from "@astryxdesign/core";
import { LinkProvider } from "@astryxdesign/core/Link";
import { yukinoshitaGlacierTheme } from "@/theme/yukinoshita-glacier/dist/yukinoshita-glacier";
import { ClientLink } from "@/components/ui/ClientLink";
import { useThemeStore, resolveMode } from "@/stores/theme";

/**
 * SeasonThemeProvider — 赛季主题运行时接线
 *
 * 1. <Theme> 注入 yukinoshita-glacier 主题（built 产物，CSS 已载入），
 *    并把明暗模式同步到 color-scheme，供令牌里的 light-dark() 自动切换。
 * 2. <LinkProvider> 把 Astryx 的 Link / Button(href) 接到自家 ClientLink，
 *    走 History API 客户端导航，不刷新页面。
 *
 * 主题代称随季度更换：换季时只需替换 yukinoshitaGlacierTheme 的导入。
 */
export function SeasonThemeProvider({ children }: { children: ReactNode }) {
  // 派生明暗（读明字段，不依赖 store getter — getter 会被 zustand 合并烘焙成陈旧快照）
  const mode = useThemeStore((s) => resolveMode(s.preference, s.systemPreference));
  const applyColorMode = useThemeStore((s) => s.applyColorMode);

  // 模式变化时同步 <html> 的 light/dark class 与 data-theme（Astryx 令牌随之切换）
  useEffect(() => {
    applyColorMode();
  }, [applyColorMode, mode]);

  return (
    <Theme theme={yukinoshitaGlacierTheme} mode={mode}>
      <LinkProvider component={ClientLink}>{children}</LinkProvider>
    </Theme>
  );
}
