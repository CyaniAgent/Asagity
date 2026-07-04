"use client";

import { lazy, Suspense } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { useSplitViewStore } from "@/stores/splitView";
import { WindowHeader } from "./WindowHeader";
import { WidgetsPanel } from "./WidgetsPanel";

const PostDetail = lazy(() =>
  import("@/components/post/PostDetail").then((m) => ({ default: m.PostDetail }))
);

interface SplitViewProps {
  children: React.ReactNode;
  isWidgetsOpen?: boolean;
}

export function SplitView({ children, isWidgetsOpen = false }: SplitViewProps) {
  const {
    isOpen,
    isMaximized,
    activeView,
    currentRightViewType,
    currentUser,
    currentChat,
    currentBrowserUrl,
    refreshKey,
    close,
    toggleMaximize,
    triggerRefresh,
    focusLeft,
    focusRight,
    focusWidgets,
  } = useSplitViewStore();

  const splitViewTitle = (() => {
    switch (currentRightViewType) {
      case "post": return "帖子详情";
      case "user": return currentUser?.displayName || "用户主页";
      case "music": return "音乐播放器";
      case "notifications": return "通知中心";
      case "chat": return currentChat?.name || "Asagity Chat";
      default: return "Split View";
    }
  })();

  return (
    <div className="flex-1 overflow-hidden p-4 pt-0">
      <PanelGroup orientation="horizontal" className="h-full w-full">
        {/* Left Panel */}
        <Panel
          id="left"
          defaultSize={isWidgetsOpen ? 40 : isOpen ? 50 : 100}
          minSize={isOpen ? 20 : 100}
        >
          <div
            className={`h-full bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden cursor-default transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              activeView === "left"
                ? "border-cyan-400/60 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                : "border-gray-200/50 dark:border-gray-800/50"
            }`}
            onPointerDown={focusLeft}
          >
            <div className="h-full overflow-y-auto p-6 lg:p-10 custom-scrollbar">
              {children}
            </div>
          </div>
        </Panel>

        {/* Right Panel Divider */}
        {isOpen && (
          <>
            <PanelResizeHandle className="w-1.5 rounded-full mx-1.5 hover:bg-cyan-500/20 active:bg-cyan-500/40 transition-colors z-30 shrink-0" />
            <Panel
              id="right"
              defaultSize={50}
              minSize={20}
            >
              <div
                className={`h-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  activeView === "right"
                    ? "border-cyan-400/60 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                    : "border-gray-200/50 dark:border-gray-800/50"
                }`}
                onPointerDown={focusRight}
              >
                <div className="h-full bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden flex flex-col">
                  <WindowHeader
                    mode="split"
                    type={currentRightViewType}
                    customTitle={splitViewTitle}
                    isMaximized={isMaximized}
                    onClose={close}
                    onToggleMaximize={toggleMaximize}
                    onRefresh={triggerRefresh}
                  />
                  <div className="flex-1 overflow-hidden">
                    {currentRightViewType === "user" && (
                      <div key={`user-${refreshKey}`} className="h-full">
                        <div className="flex items-center justify-center h-full text-gray-400">
                          UserProfile
                        </div>
                      </div>
                    )}
                    {currentRightViewType === "post" && (
                      <div key={`post-${refreshKey}`} className="h-full">
                        <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400">Loading...</div>}>
                          <PostDetail />
                        </Suspense>
                      </div>
                    )}
                    {currentRightViewType === "notifications" && (
                      <div key={`notif-${refreshKey}`} className="h-full">
                        <div className="flex items-center justify-center h-full text-gray-400">Notifications</div>
                      </div>
                    )}
                    {currentRightViewType === "chat" && (
                      <div key={`chat-${refreshKey}`} className="h-full">
                        <div className="flex items-center justify-center h-full text-gray-400">ChatDetail</div>
                      </div>
                    )}
                    {currentRightViewType === "browser" && (
                      <div className="h-full">
                        <iframe src={currentBrowserUrl} className="w-full h-full border-0" title="Browser" />
                      </div>
                    )}
                    {currentRightViewType === "music" && (
                      <div className="h-full">
                        <div className="flex items-center justify-center h-full text-gray-400">MusicPlayer</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          </>
        )}

        {/* Widgets Panel */}
        {isWidgetsOpen && (
          <>
            <PanelResizeHandle className="w-1.5 rounded-full mx-1.5 hover:bg-cyan-500/20 active:bg-cyan-500/40 transition-colors z-30 shrink-0" />
            <Panel
              id="widgets"
              defaultSize={30}
              minSize={15}
            >
              <div
                className={`h-full bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden flex flex-col ${
                  activeView === "widgets"
                    ? "border-cyan-400/60 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                    : "border-gray-200/50 dark:border-gray-800/50"
                }`}
                onPointerDown={focusWidgets}
              >
                <WidgetsPanel />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
