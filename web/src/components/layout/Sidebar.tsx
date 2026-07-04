"use client";

import { forwardRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useInstanceStore } from "@/stores/instance";
import { useSplitViewStore } from "@/stores/splitView";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface SidebarProps {
  onMoreClick?: () => void;
  moreButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

interface NavItem {
  label: string;
  icon: string;
  to: string;
  activePaths?: string[];
  isMore?: boolean;
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(function Sidebar(
  { onMoreClick, moreButtonRef },
  _ref
) {
  const { t } = useI18n();
  const pathname = usePathname();
  const instanceStore = useInstanceStore();
  const splitViewStore = useSplitViewStore();

  const navigation: NavItem[][] = [
    [
      { label: t("sidebar.timeline"), icon: "home", to: "/", activePaths: ["/", "/followed", "/local"] },
      { label: t("sidebar.topics"), icon: "tag", to: "/topic" },
      { label: t("sidebar.bookmarks"), icon: "bookmark", to: "/bookmarks" },
      { label: t("sidebar.skylineDrive"), icon: "cloud", to: "/drive" },
    ],
    [
      { label: t("sidebar.chat"), icon: "chat", to: "/chat" },
      { label: t("sidebar.announcements"), icon: "campaign", to: "/announcement" },
      { label: t("sidebar.clubs"), icon: "group", to: "/orgs" },
    ],
    [
      { label: t("sidebar.settings"), icon: "settings", to: "/settings" },
      { label: t("sidebar.more"), icon: "more_horiz", to: "/more", isMore: true },
      { label: t("sidebar.panel"), icon: "terminal", to: "/panel" },
    ],
  ];

  return (
    <aside className="w-64 h-full flex flex-col shrink-0 z-20">
      {/* Logo */}
      <Link href="/about" className="h-24 flex items-center px-6 shrink-0 group/logo cursor-pointer">
        <div className="w-12 h-12 flex items-center justify-center group-hover/logo:scale-110 transition-all duration-300">
          <Image src={instanceStore.logoURL} width={48} height={48} className="w-full h-full object-cover" alt="Logo" />
        </div>
        <div className="absolute left-20 opacity-0 group-hover/logo:opacity-100 translate-x-[-10px] group-hover/logo:translate-x-0 transition-all duration-300 pointer-events-none z-50">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/20 dark:border-gray-800 shadow-2xl flex flex-col min-w-[140px]">
            <span className="text-[10px] font-normal text-cyan-500 mb-1">{t("sidebar.thisInstance")}</span>
            <span className="text-sm font-normal text-gray-900 dark:text-white leading-tight">{instanceStore.name}</span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar flex flex-col gap-3">
        {navigation.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-0.5">
            {group.map((item) => {
              const isActive = !("isMore" in item && item.isMore) && (
                item.activePaths?.some((p) =>
                  p === "/" ? pathname === "/" : pathname.startsWith(p)
                ) || pathname.startsWith(item.to)
              );

              if ("isMore" in item && item.isMore) {
                return (
                  <button
                    key={item.label}
                    ref={moreButtonRef}
                    onClick={onMoreClick}
                    className="flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-colors font-normal group/nav hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                  >
                    <span className="opacity-70 group-hover/nav:opacity-100 transition-opacity">
                      <Icon name={item.icon} fontSize={22} />
                    </span>
                    <span className="text-[15px]">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.to}
                  className={`flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-colors font-normal group/nav ${
                    isActive
                      ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                      : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className={`transition-opacity ${
                    isActive ? "opacity-100" : "opacity-70 group-hover/nav:opacity-100"
                  }`}>
                    <Icon name={item.icon} fontSize={22} />
                  </span>
                  <span className="text-[15px]">{item.label}</span>
                </Link>
              );
            })}
            {gIdx < navigation.length - 1 && (
              <div className="h-px bg-gray-200 dark:bg-white/10 my-2.5 mx-3" />
            )}
          </div>
        ))}
      </nav>

      {/* Split View Task Manager */}
      {splitViewStore.isOpen && (
        <div className="px-4 pb-2 shrink-0 animate-[fadeIn_0.3s_ease-out]">
          <div className="text-[10px] font-normal text-gray-400 dark:text-gray-500 mb-2 px-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            {t("sidebar.activeDisplay")}
          </div>
          <div className="bg-gray-100 dark:bg-gray-800/80 rounded-[20px] p-3 border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group cursor-pointer backdrop-blur-md">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm">
                <Icon name="arrow_left" className="text-cyan-600 dark:text-cyan-400" fontSize={16} />
              </div>
              <span className="text-sm font-normal text-gray-900 dark:text-white truncate">{t("sidebar.splitView")}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); splitViewStore.close(); }}
              className="rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 hover:text-red-500"
            >
              <Icon name="close" fontSize={16} />
            </button>
          </div>
        </div>
      )}

      {/* Compose Button */}
      <div className="p-4 shrink-0">
        <button className="w-full justify-center rounded-full shadow-[0_0_15px_rgba(57,197,187,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(57,197,187,0.8)] font-normal text-base bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 px-4 flex items-center gap-2">
          <Icon name="send" className="text-white" fontSize={18} />
          {t("sidebar.publish")}
        </button>
      </div>
    </aside>
  );
});
