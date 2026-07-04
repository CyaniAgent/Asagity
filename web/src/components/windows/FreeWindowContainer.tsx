"use client";

import { useFreeWindowStore } from "@/stores/freeWindow";
import { FreeWindow } from "@/components/windows/FreeWindow";
import { Termity } from "@/components/termity/Termity";
import { LyricsWindow } from "@/components/music/LyricsWindow";
import { PlaylistWindow } from "@/components/music/PlaylistWindow";

export function FreeWindowContainer() {
  const {
    isOpen,
    currentViewType,
    close,
  } = useFreeWindowStore();

  if (!isOpen || !currentViewType) return null;

  const getTitle = () => {
    switch (currentViewType) {
      case "termity":
        return "Termity (Recovery)";
      case "lyrics_window":
        return "Lyrics Window";
      case "playlist_window":
        return "Playlist";
      case "error":
        return "系统错误";
      default:
        return "Free Window";
    }
  };

  const getIcon = () => {
    switch (currentViewType) {
      case "termity":
        return "terminal";
      case "lyrics_window":
        return "lyrics";
      case "playlist_window":
        return "queue_music";
      case "error":
        return "error";
      default:
        return "tab_move";
    }
  };

  const renderContent = () => {
    switch (currentViewType) {
      case "termity":
        return <Termity />;
      case "lyrics_window":
        return <LyricsWindow />;
      case "playlist_window":
        return <PlaylistWindow />;
      default:
        return <div className="p-4 text-gray-500">未知视图类型</div>;
    }
  };

  return (
    <FreeWindow
      isOpen={isOpen}
      title={getTitle()}
      icon={getIcon()}
      type={currentViewType}
      initialWidth={
        currentViewType === "termity" ? 700
        : currentViewType === "lyrics_window" ? 400
        : 350
      }
      initialHeight={
        currentViewType === "termity" ? 500
        : currentViewType === "lyrics_window" ? 600
        : 500
      }
      onClose={close}
    >
      {renderContent()}
    </FreeWindow>
  );
}
