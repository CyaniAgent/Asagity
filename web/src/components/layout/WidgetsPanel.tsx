"use client";

import { MusicPlayer } from "@/components/music/MusicPlayer";

export function WidgetsPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      <div className="flex flex-col gap-6 items-center">
        <MusicPlayer />
      </div>
    </div>
  );
}
