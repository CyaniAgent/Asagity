"use client";

import { lazy, Suspense } from "react";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useUserStore } from "@/stores/user";
import { FreeWindow } from "@/components/windows/FreeWindow";
import { startMemoryMonitor } from "@/lib/memoryManager";
import { useEffect } from "react";
import { useTermitySessionsStore } from "@/stores/termitySessions";
import { usePageStripStore } from "@/stores/pageStrip";
import { AuthShell } from "@/components/auth/AuthShell";
/* 登录/注册表单与 AuthShell 同为静态引入：auth 外壳的"切换不卸载"动画
 * 依赖整个子树永不 Suspense 挂起——一旦挂起，楔形会被 fallback 转圈替换
 * （表现为切换注册页时闪过 loading 圈）。这几个组件体量很小，不值得拆 chunk。 */
import { LoginPage } from "@/components/auth/LoginPage";
import { RegisterPage } from "@/components/auth/RegisterPage";

const Termity = lazy(() =>
  import("@/components/termity/Termity").then((m) => ({ default: m.Termity }))
);
const TermitySessionSelector = lazy(() =>
  import("@/components/termity/TermitySessionSelector").then((m) => ({
    default: m.TermitySessionSelector,
  }))
);
const LyricsWindow = lazy(() =>
  import("@/components/music/LyricsWindow").then((m) => ({ default: m.LyricsWindow }))
);
const PlaylistWindow = lazy(() =>
  import("@/components/music/PlaylistWindow").then((m) => ({ default: m.PlaylistWindow }))
);
const PortalDebuggerContent = lazy(() =>
  import("@/components/portal-debugger/PortalDebuggerContent").then((m) => ({
    default: m.PortalDebuggerContent,
  }))
);
const AuthForm = lazy(() =>
  import("@/components/auth/AuthForm").then((m) => ({ default: m.AuthForm }))
);

const TimelineFeed = lazy(() =>
  import("@/components/post/TimelineFeed").then((m) => ({ default: m.TimelineFeed }))
);
const SystemInfoContent = lazy(() =>
  import("@/components/system/SystemInfoContent").then((m) => ({ default: m.SystemInfoContent }))
);

function WindowManagerFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function getViewConfig(viewType: string | null) {
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
    case "login_window":
      return { title: "登录", icon: "lock", width: 780, height: 520, disableMinimize: true };
    case "register_window":
      return { title: "注册新账号", icon: "person_add", width: 780, height: 520, disableMinimize: true };
    case "welcome_timeline":
      return { title: "时间线", icon: "public", width: 500, height: 600, disableMinimize: true };
    case "welcome_federation":
      return { title: "联邦实例", icon: "globe", width: 500, height: 600, disableMinimize: true };
    case "welcome_dashboard":
      return { title: "数据面板", icon: "dashboard", width: 500, height: 600, disableMinimize: true };
    case "system_info":
      return { title: "系统信息", icon: "server", width: 760, height: 660, minWidth: 560, minHeight: 420 };
    case "portal_debugger":
      return { title: "Portal Debugger", icon: "terminal", width: 1184, height: 756, minWidth: 720, minHeight: 480 };
    default:
      return { title: "Free Window", icon: "tab_move", width: 450, height: 600 };
  }
}

export function renderContent(viewType: string | null, refreshKey: number, browserUrl?: string, windowId?: string, sessionId?: string) {
  switch (viewType) {
    case "error":
      return <div className="p-4 text-bad">系统错误内容</div>;
    case "post":
      return <div key={`post-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-fgdim">PostDetail</div></div>;
    case "user":
      return <div key={`user-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-fgdim">UserProfile</div></div>;
    case "music":
      return <div className="h-full"><div className="flex items-center justify-center h-full text-fgdim">MusicPlayer</div></div>;
    case "notifications":
      return <div key={`notif-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-fgdim">Notifications</div></div>;
    case "chat":
      return <div key={`chat-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-fgdim">ChatDetail</div></div>;
    case "admin_database":
      return <div key={`db-${refreshKey}`} className="h-full"><div className="flex items-center justify-center h-full text-fgdim">DatabaseDetails</div></div>;
    case "browser":
      return <iframe src={browserUrl} className="w-full h-full border-0" title="Browser" />;
    case "termity":
      return (
        <Suspense fallback={<WindowManagerFallback />}>
          <Termity windowId={windowId!} sessionId={sessionId} />
        </Suspense>
      );
    case "lyrics_window":
      return <Suspense fallback={<WindowManagerFallback />}><LyricsWindow /></Suspense>;
    case "playlist_window":
      return <Suspense fallback={<WindowManagerFallback />}><PlaylistWindow /></Suspense>;
    case "auth":
      return <Suspense fallback={<WindowManagerFallback />}><AuthForm /></Suspense>;
    /* 两个视图共用同一个 AuthShell 实例：切 viewType 时外壳不会被
     * 卸载，楔形和品牌块才能真的从一侧滑到另一侧。 */
    case "login_window":
    case "register_window": {
      const isRegister = viewType === "register_window";
      return (
        <Suspense fallback={<WindowManagerFallback />}>
          <AuthShell side={isRegister ? "left" : "right"} windowId={windowId ?? ""}>
            {isRegister ? <RegisterPage /> : <LoginPage />}
          </AuthShell>
        </Suspense>
      );
    }
    case "welcome_timeline":
      return <Suspense fallback={<WindowManagerFallback />}><TimelineFeed /></Suspense>;
    case "welcome_federation":
      return <div className="flex items-center justify-center h-full text-fgdim text-sm">联邦实例列表开发中</div>;
    case "welcome_dashboard":
      return <div className="flex items-center justify-center h-full text-fgdim text-sm">数据面板开发中</div>;
    case "portal_debugger":
      return <Suspense fallback={<WindowManagerFallback />}><PortalDebuggerContent /></Suspense>;
    case "system_info":
      return (
        <Suspense fallback={<WindowManagerFallback />}>
          <SystemInfoContent key={`sysinfo-${refreshKey}`} refreshKey={refreshKey} />
        </Suspense>
      );
    default:
      return <div className="p-4 text-fgdim">未知视图类型</div>;
  }
}

export function WindowManager() {
  const windows = useFreeWindowStore((s) => s.windows);
  const close = useFreeWindowStore((s) => s.close);
  const focus = useFreeWindowStore((s) => s.focus);
  const setMinimized = useFreeWindowStore((s) => s.setMinimized);
  const triggerRefresh = useFreeWindowStore((s) => s.triggerRefresh);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const isWelcomePage = !isLoggedIn;
  const focusedId = useFreeWindowStore((s) => s.focusedId);
  // Termity 当前激活的 Session（标题栏选择器与终端内容共用）
  const activeSessionId = useTermitySessionsStore((s) => s.activeId);
  // 最近使用顺序：活跃窗口置顶，其余按 lastFocusedAt 稳定层叠
  const orderedIds = [...windows]
    .sort((a, b) => a.lastFocusedAt - b.lastFocusedAt)
    .map((w) => w.id);

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
            windowId={win.id}
            initialWidth={config.width}
            initialHeight={config.height}
            minWidth={(config as { minWidth?: number }).minWidth}
            minHeight={(config as { minHeight?: number }).minHeight}
            disableMaximize={config.disableMaximize}
            disableMinimize={config.disableMinimize || isWelcomePage}
            disableTransfer={config.disableTransfer || isWelcomePage}
            hideHeader={win.viewType === "login_window" || win.viewType === "register_window"}
            onClose={() => close(win.id)}
            onFocus={() => focus(win.id)}
            onMinimize={(v) => setMinimized(win.id, v)}
            onSwitchMode={() => {
              usePageStripStore.getState().openTab({
                appId: win.viewType,
                icon: config.icon ?? "tab_move",
                title: config.title,
                view: {
                  kind: "window",
                  refId: win.viewType,
                  browserUrl: win.browserUrl,
                },
              });
              close(win.id);
            }}
            isActive={focusedId === win.id}
            stackOrder={orderedIds.indexOf(win.id)}
            onRefresh={() => triggerRefresh(win.id)}
            renderTitle={
              win.viewType === "termity"
                ? () => (
                    <Suspense fallback={<span className="text-[14px] text-fg">Session</span>}>
                      <TermitySessionSelector />
                    </Suspense>
                  )
                : undefined
            }
          >
            {renderContent(
              win.viewType,
              win.refreshKey,
              win.browserUrl,
              win.id,
              win.viewType === "termity" ? activeSessionId : undefined
            )}
          </FreeWindow>
        );
      })}
    </>
  );
}
