"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme";

/**
 * Initializes the theme store on mount.
 * Reads system preference, applies color mode to <html>, and
 * listens for OS theme changes.
 */
export function ThemeInit() {
  const init = useThemeStore((s) => s.init);
  const destroy = useThemeStore((s) => s.destroy);

  useEffect(() => {
    init();
    return () => destroy();
  }, [init, destroy]);

  return null;
}
