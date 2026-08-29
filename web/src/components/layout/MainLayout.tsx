"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSystemStore } from "@/stores/system";
import { useUserStore } from "@/stores/user";
import { useSplitViewStore } from "@/stores/splitView";
import { useThemeStore } from "@/stores/theme";
import { useMusicStore } from "@/stores/music";
import { Sidebar } from "./Sidebar";
import { MoreMenuPopover } from "./MoreMenuPopover";
import { SplitView } from "./SplitView";
import { MobileNav } from "./MobileNav";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const SplashScreen = dynamic(
  () => import("@/components/ui/SplashScreen").then((m) => m.SplashScreen),
  { ssr: false }
);

const ContextMenu = dynamic(
  () => import("@/components/ui/ContextMenu").then((m) => m.ContextMenu),
  { ssr: false }
);

const NetworkStatus = dynamic(
  () => import("@/components/shared/NetworkStatus").then((m) => m.NetworkStatus),
  { ssr: false }
);

export function MainLayout({ children, notFound }: { children: React.ReactNode; notFound?: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

  const isBackendOnline = useSystemStore((s) => s.isBackendOnline);
  const isDevMode = useSystemStore((s) => s.isDevMode);
  const initSequence = useSystemStore((s) => s.initSequence);
  const userAvatar = useUserStore((s) => s.avatar);
  const username = useUserStore((s) => s.username);
  const userName = useUserStore((s) => s.user?.name);
  const logout = useUserStore((s) => s.logout);
  const splitViewStore = useSplitViewStore();
  const isDark = useThemeStore((s) => s.isDark);
  const modeLabel = useThemeStore((s) => s.modeLabel);
  const preference = useThemeStore((s) => s.preference);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const currentTrackTitle = useMusicStore((s) => s.currentTrack.title);
  const currentTrackAlbumArt = useMusicStore((s) => s.currentTrack.albumArt);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const togglePlay = useMusicStore((s) => s.togglePlay);

  const moreMenuRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const timelineTabs = [
    { label: t("tabs.timeline"), icon: "public", to: "/" },
    { label: t("tabs.followed"), icon: "person", to: "/?tab=followed" },
    { label: t("tabs.localOnly"), icon: "dns", to: "/?tab=local" },
  ];

  const chatTabs = [
    { label: t("tabs.messages"), icon: "chat", to: "/chat" },
    { label: t("tabs.contacts"), icon: "contacts", to: "/chat/contacts" },
    { label: t("tabs.meet"), icon: "videocam", to: "/chat/meet" },
  ];

  const settingsTabs = [
    { label: t("tabs.profile"), icon: "person", to: "/settings/profile" },
    { label: t("tabs.skylineDrive"), icon: "cloud", to: "/settings/drive" },
    { label: t("tabs.securityPrivacy"), icon: "settings", to: "/settings/security" },
    { label: t("tabs.notifications"), icon: "notifications", to: "/settings/notifications" },
    { label: t("tabs.personalization"), icon: "palette", to: "/settings/personalization" },
    { label: t("tabs.sound"), icon: "volume_up", to: "/settings/sound" },
    { label: t("tabs.plugins"), icon: "extension", to: "/settings/plugins" },
  ];

  const driveTabs = [
    { label: t("tabs.files"), icon: "folder", to: "/drive" },
    { label: t("tabs.shared"), icon: "folder_shared", to: "/drive/shared" },
    { label: t("tabs.drop"), icon: "sync", to: "/drive/drop" },
  ];

  const panelTabs = [
    { label: t("tabs.overview"), icon: "dashboard", to: "/panel" },
    { label: t("tabs.users"), icon: "group", to: "/panel/users" },
    { label: t("tabs.federation"), icon: "globe", to: "/panel/federation" },
    { label: t("tabs.emojis"), icon: "emoji", to: "/panel/emojis" },
    { label: t("tabs.announcements"), icon: "campaign", to: "/panel/announcements" },
    { label: t("tabs.reports"), icon: "flag", to: "/panel/abuses" },
    { label: t("tabs.logs"), icon: "history", to: "/panel/modlog" },
    { label: t("tabs.settings"), icon: "settings", to: "/panel/settings" },
  ];

  const topicTabs = [
    { label: t("tabs.topics"), icon: "tag", to: "/topic" },
    { label: t("tabs.createTopic"), icon: "add", to: "/topic/create" },
  ];

  const bookmarkTabs = [
    { label: t("tabs.bookmarks"), icon: "bookmark", to: "/bookmarks" },
  ];

  const announcementTabs = [
    { label: t("tabs.currentAnnouncements"), icon: "flare", to: "/announcement" },
    { label: t("tabs.pastAnnouncements"), icon: "history", to: "/announcement?tab=past" },
  ];

  const profileTabs = [
    { label: t("tabs.home"), icon: "home", slot: "home" },
    { label: t("tabs.timeline"), icon: "article", slot: "posts" },
    { label: t("tabs.files"), icon: "folder", slot: "files" },
    { label: t("tabs.rawData"), icon: "terminal", slot: "raw" },
  ];

  const aboutTabs: { label: string; icon: string; to: string }[] = [];

  const notFoundTabs = [
    { label: t("notFound.back"), icon: "arrow_back", to: "__back__" },
    { label: t("tabs.timeline"), icon: "public", to: "/" },
  ];

  useEffect(() => {
    initSequence();
  }, []);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreMenuOpen]);

  const currentTabs = (() => {
    if (notFound) return notFoundTabs;
    if (pathname.startsWith("/chat")) return chatTabs;
    if (pathname.startsWith("/settings")) return settingsTabs;
    if (pathname.startsWith("/drive")) return driveTabs;
    if (pathname.startsWith("/panel")) return panelTabs;
    if (pathname.startsWith("/topic")) return topicTabs;
    if (pathname.startsWith("/bookmarks")) return bookmarkTabs;
    if (pathname.startsWith("/announcement")) return announcementTabs;
    if (pathname.startsWith("/about")) return aboutTabs;
    return timelineTabs;
  })();

  const isItemActive = useCallback(
    (item: { to: string }) => {
      if (item.to === "/") return pathname === "/";
      if (item.to.includes("?tab=")) {
        const [path, query] = item.to.split("?");
        return pathname === path && window.location.search.includes(query);
      }
      return pathname.startsWith(item.to);
    },
    [pathname]
  );

  return (
    <div className="h-screen w-screen flex bg-gray-100 dark:bg-[#121212] overflow-hidden font-sans">
      <SplashScreen />
      <ContextMenu />
      <NetworkStatus />

      <Sidebar onMoreClick={() => setMoreMenuOpen(!moreMenuOpen)} moreButtonRef={moreButtonRef} />
      <MoreMenuPopover open={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} triggerRef={moreButtonRef} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex justify-between items-center px-6 shrink-0 z-10">
          <div className="flex items-center">
            {splitViewStore.isOpen && splitViewStore.activeView === "right" && splitViewStore.currentRightViewType === "user" ? (
              <div className="flex items-center">
                {profileTabs.map((tab) => (
                  <button
                    key={tab.slot}
                    className={`flex items-center gap-1.5 whitespace-nowrap py-1.5 px-3 text-sm transition-all border-b-2 ${
                      splitViewStore.profileTab === tab.slot
                        ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                    onClick={() => splitViewStore.setProfileTab(tab.slot as typeof splitViewStore.profileTab)}
                  >
                    <Icon name={tab.icon} fontSize={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <nav className="flex items-center gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
                {currentTabs.map((tab) => {
                  const active = isItemActive(tab);
                  const isBack = tab.to === "__back__";
                  const className = `flex items-center gap-1.5 whitespace-nowrap py-2 px-3 rounded-xl text-sm transition-all ${
                    active
                      ? "text-cyan-600 dark:text-cyan-400 font-semibold"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`;

                  if (isBack) {
                    return (
                      <button
                        key={tab.to}
                        onClick={() => router.back()}
                        className={className}
                      >
                        <Icon name={tab.icon} fontSize={16} />
                        {tab.label}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={tab.to}
                      href={tab.to}
                      className={className}
                    >
                      <Icon name={tab.icon} fontSize={16} />
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div
              className="flex items-center gap-2 px-2 h-8 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-sm cursor-help"
              title={isBackendOnline ? t("header.serverConnected") : t("header.serverDisconnected")}
            >
              <span className={isBackendOnline ? "text-green-400" : "text-red-400 animate-pulse"}>
                <Icon name={isBackendOnline ? "signal_cellular_alt" : "wifi_off"} fontSize={16} />
              </span>
              {isDevMode && (
                <>
                  <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-0.5" />
                  <Icon name="terminal" className="text-cyan-500" fontSize={14} />
                  <span className="text-[10px] font-normal text-cyan-500">{t("header.inDevelopment")}</span>
                </>
              )}
            </div>

            {/* Music Player Mini */}
            <div className="flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full pr-2 pl-1 py-1 border border-white/20 dark:border-gray-700/50 shadow-sm cursor-pointer hover:scale-105 transition-transform">
              <Image src={currentTrackAlbumArt} width={24} height={24} className="w-6 h-6 rounded-full object-cover shadow-sm" alt="Art" />
              <div className="w-24 overflow-hidden">
                <div className={`text-xs font-normal whitespace-nowrap inline-block text-gray-800 dark:text-gray-100 ${isPlaying ? "animate-[marquee_10s_linear_infinite]" : ""}`}>
                  {currentTrackTitle}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="rounded-full hover:bg-cyan-500/20 p-1 transition-colors"
              >
                <Icon name={isPlaying ? "pause" : "play_arrow"} fontSize={16} />
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center h-8 px-2 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-sm hover:scale-105 transition-transform"
              title={`${t("header.current")}${modeLabel}`}
            >
              <span className={isDark ? "text-cyan-400" : "text-yellow-500"}>
                <Icon name={preference === "dark" ? "dark_mode" : preference === "light" ? "light_mode" : "settings_brightness"} fontSize={16} />
              </span>
            </button>

            {/* Widgets Toggle */}
            <button
              onClick={() => setIsWidgetsOpen(!isWidgetsOpen)}
              className={`flex items-center justify-center p-2 rounded-xl transition-colors ${
                isWidgetsOpen ? "text-cyan-500" : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon name="widgets" fontSize={20} />
            </button>

            {/* Notifications */}
            <button
              onClick={() => splitViewStore.openNotifications()}
              className="relative flex items-center justify-center p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Icon name="notifications" fontSize={20} />
              <span className="absolute top-1 right-1 flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-red-500" />
              </span>
            </button>

            {/* User Avatar */}
            <div className="relative">
              <button
                onClick={() => username ? router.push(`/user/${username}`) : setUserPopoverOpen(!userPopoverOpen)}
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-cyan-500/50 hover:ring-cyan-500 transition-all cursor-pointer"
              >
                {userAvatar ? (
                  <Image src={userAvatar} width={32} height={32} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
                    <Icon name="person" className="text-cyan-500" fontSize={16} />
                  </div>
                )}
              </button>

              {userPopoverOpen && (
                <div className="fixed top-16 right-4 z-[100] w-72 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl shadow-black/20 p-4 animate-[fadeInUp_0.15s_ease-out]">
                  <div
                    className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200/50 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 -mt-4 px-4 pt-4 rounded-t-3xl transition-colors"
                    onClick={() => {
                      router.push(`/user/${username}`);
                      setUserPopoverOpen(false);
                    }}
                  >
                    <Image src={userAvatar} width={40} height={40} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">@{username}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href="/settings/profile" onClick={() => setUserPopoverOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors">
                      <Icon name="settings" fontSize={16} />
                      {t("header.settings")}
                    </Link>
                    <button onClick={() => { logout(); setUserPopoverOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Icon name="close" fontSize={16} />
                      {t("header.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <SplitView isWidgetsOpen={isWidgetsOpen}>{children}</SplitView>
      </main>

      <MobileNav />
    </div>
  );
}
