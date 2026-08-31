"use client";

import { lazy, Suspense } from "react";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useUserStore } from "@/stores/user";
import { FreeWindow } from "@/components/windows/FreeWindow";
import { startMemoryMonitor } from "@/lib/memoryManager";
import { useEffect } from "react";

const Termity = lazy(() =>
  import("@/components/termity/Termity").then((m) => ({ default: m.Termity }))
);
const LyricsWindow = lazy(() =>
  import("@/components/music/LyricsWindow").then((m) => ({ default: m.LyricsWindow }))
);
const PlaylistWindow = lazy(() =>
  import("@/components/music/PlaylistWindow").then((m) => ({ default: m.PlaylistWindow }))
);
const AuthForm = lazy(() =>
  import("@/components/auth/AuthForm").then((m) => ({ default: m.AuthForm }))
);
const TimelineFeed = lazy(() =>
  import("@/components/post/TimelineFeed").then((m) => ({ default: m.TimelineFeed }))
);

function WindowManagerFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function getViewConfig(viewType: string | null) {
  switch (viewType) {
    case "error":
      return { title: "系统错误", icon: "error", width: 400, height: 480, disableMaximize: true, disableMinimize: true, disableTransfer: true };
    case "music":
      return { title: "音乐播放器", icon: "music_note", width: 342, height: 450, disableMaximize: true };
    case "post":
      return { title: "帖子详情", icon: "article", width: 450, height: 600 };
    case "user":
      return { title: "用户主页", icon: "person", width: 450, height: 600 };
    case "notifications":
      return { title: "通知中心", icon: "notifications", width: 400, height: 600 };
    case "chat":
      return { title: "Asagity Chat", icon: "forum", width: 450, height: 600 };
    case "admin_database":
      return { title: "数据库详细信息", icon: "database", width: 450, height: 600 };
    case "browser":
      return { title: "浏览器", icon: "language", width: 800, height: 600 };
    case "termity":
      return { title: "Termity", icon: "terminal", width: 700, height: 500 };
    case "lyrics_window":
      return { title: "Lyrics Window", icon: "lyrics", width: 400, height: 600, disableTransfer: true };
    case "playlist_window":
      return { title: "Playlist", icon: "queue_music", width: 350, height: 500, disableTransfer: true };
    case "auth":
      return { title: "身份认证", icon: "lock", width: 420, height: 560, disableMinimize: true };
    case "welcome_timeline":
      return { title: "时间线", icon: "public", width: 500, height: 600, disableMinimize: true };
    case "welcome_federation":
      return { title: "联邦实例", icon: "globe", width: 500, height: 600, disableMinimize: true };
    case "welcome_dashboard":
      return { title: "数据面板", icon: "dashboard", width: 500, height: 600, disableMinimize: true };
    default:
      return { title: "Free Window", icon: "tab_move", width: 450, height: 600 };
  }
}

function renderContent(viewType: string | null, refreshKey: number, browserUrl?: string) {
  switch (viewType) {
    case "error":
      return <div className="p-4 text-red-500">系统错误内容</div>;
    case "post":
      return <div key={`post-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-gray-400">PostDetail</div></div>;
    case "user":
      return <div key={`user-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-gray-400">UserProfile</div></div>;
    case "music":
      return <div className="h-full"><div className="flex items-center justify-center h-full text-gray-400">MusicPlayer</div></div>;
    case "notifications":
      return <div key={`notif-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-gray-400">Notifications</div></div>;
    case "chat":
      return <div key={`chat-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-gray-400">ChatDetail</div></div>;
    case "admin_database":
      return <div key={`db-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-gray-400">DatabaseDetails</div></div>;
    case "browser":
      return <iframe src={browserUrl} className="w-full h-full border-0" title="Browser" />;
    case "termity":
      return <Suspense fallback={<WindowManagerFallback />}><Termity /></Suspense>;
    case "lyrics_window":
      return <Suspense fallback={<WindowManagerFallback />}><LyricsWindow /></Suspense>;
    case "playlist_window":
      return <Suspense fallback={<WindowManagerFallback />}><PlaylistWindow /></Suspense>;
    case "auth":
      return <Suspense fallback={<WindowManagerFallback />}><AuthForm /></Suspense>;
    case "welcome_timeline":
      return <Suspense fallback={<WindowManagerFallback />}><TimelineFeed /></Suspense>;
    case "welcome_federation":
      return <div className="flex items-center justify-center h-full text-gray-400 text-sm">联邦实例列表开发中</div>;
    case "welcome_dashboard":
      return <div className="flex items-center justify-center h-full text-gray-400 text-sm">数据面板开发中</div>;
    default:
      return <div className="p-4 text-gray-500">未知视图类型</div>;
  }
}

export function WindowManager() {
  const windows = useFreeWindowStore((s) => s.windows);
  const close = useFreeWindowStore((s) => s.close);
  const focus = useFreeWindowStore((s) => s.focus);
  const triggerRefresh = useFreeWindowStore((s) => s.triggerRefresh);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const isWelcomePage = !isLoggedIn;

  // Start memory monitor once
  useEffect(() => {
    startMemoryMonitor((ids) => {
      console.log(`[MemoryManager] Auto-minimized ${ids.length} window(s)`);
    });
  }, []);

  if (windows.length === 0) return null;

  return (
    <>
      {windows.map((win) => {
        const config = getViewConfig(win.viewType);
        return (
          <FreeWindow
            key={win.id}
            isOpen={!win.isMinimized}
            title={config.title}
            icon={config.icon}
            type={win.viewType}
            initialWidth={config.width}
            initialHeight={config.height}
            disableMaximize={config.disableMaximize}
            disableMinimize={config.disableMinimize || isWelcomePage}
            disableTransfer={config.disableTransfer || isWelcomePage}
            onClose={() => close(win.id)}
            onFocus={() => focus(win.id)}
            onRefresh={() => triggerRefresh(win.id)}
          >
            {renderContent(win.viewType, win.refreshKey, win.browserUrl)}
          </FreeWindow>
        );
      })}
    </>
  );
}
