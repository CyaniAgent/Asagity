"use client";

import { useRef, useState } from "react";
import { ClientLink as Link } from "@/components/ui/ClientLink";
import { usePathname } from "@/hooks/usePathname";
import { usePageManagerStore } from "@/stores/pageManager";
import { isMenuActive } from "./pageManagerConfig";
import { MoreMenuPopover } from "@/components/layout/MoreMenuPopover";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/** 上部分：菜单直达（数据驱动渲染，active 互斥高亮） */
export function QuickMenu() {
  const { t } = useI18n();
  const pathname = usePathname();
  const menu = usePageManagerStore((s) => s.menu);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const search = typeof window !== "undefined" ? window.location.search : "";

  return (
    <>
      <nav className="flex flex-col gap-0.5">
        {menu.map((entry) => {
          if (entry.kind === "separator") {
            return (
              <div key={entry.id} className="h-px bg-gray-200 dark:bg-white/10 my-2.5 mx-3" />
            );
          }
          if (entry.kind === "more") {
            return (
              <button
                key={entry.id}
                ref={moreButtonRef}
                onClick={() => setMoreOpen((v) => !v)}
                className="flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-colors font-normal group/nav hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              >
                <span className="opacity-70 group-hover/nav:opacity-100 transition-opacity">
                  <Icon name={entry.icon} fontSize={22} />
                </span>
                <span className="text-[15px]">{t(entry.labelKey)}</span>
              </button>
            );
          }
          const active = isMenuActive(entry, pathname, search);
          return (
            <Link
              key={entry.id}
              href={entry.query ? `${entry.to}${entry.query}` : entry.to}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-colors font-normal group/nav ${
                active
                  ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className={`transition-opacity ${active ? "opacity-100" : "opacity-70 group-hover/nav:opacity-100"}`}>
                <Icon name={entry.icon} fontSize={22} />
              </span>
              <span className="text-[15px]">{t(entry.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <MoreMenuPopover
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        triggerRef={moreButtonRef}
      />
    </>
  );
}
