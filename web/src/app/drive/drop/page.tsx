"use client";

import { useState } from "react";
import Image from "next/image";
import { useUserStore } from "@/stores/user";
import { useSystemStore } from "@/stores/system";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface PeerNode {
  id: string;
  displayName: string;
  username: string;
  system: string;
  avatar: string;
  isSelf?: boolean;
  isRemote?: boolean;
}

interface DropTask {
  id: string;
  fileName: string;
  fileSize: string;
  progress: number;
  speed: string;
  direction: "send" | "receive";
  state: "active" | "paused" | "completed";
  targetUserName: string;
  targetAvatar: string;
}

const mockPeers: PeerNode[] = [
  { id: "1", displayName: "iPhone 15", username: "syskuku", system: "iOS", avatar: "", isSelf: true },
  { id: "2", displayName: "MacBook Pro", username: "syskuku", system: "macOS", avatar: "", isSelf: true },
  { id: "4", displayName: "Yuna Ayase", username: "yuna_ayase", system: "Web", avatar: "" },
  { id: "5", displayName: "静流", username: "shizuru", system: "Android", avatar: "" },
  { id: "6", displayName: "Miku Producer", username: "miku39", system: "Web", avatar: "" },
  { id: "7", displayName: "misskey.io", username: "remote", system: "Instance", avatar: "", isRemote: true },
];

const mockTasks: DropTask[] = [
  {
    id: "t-1",
    fileName: "Project_Final_v2.psd",
    fileSize: "412 MB",
    progress: 72,
    speed: "24.1 MB/s",
    direction: "send",
    state: "active",
    targetUserName: "syskuku",
    targetAvatar: "",
  },
  {
    id: "t-2",
    fileName: "Vocaloid_Miku.zip",
    fileSize: "1.2 GB",
    progress: 32,
    speed: "0 KB/s",
    direction: "receive",
    state: "paused",
    targetUserName: "shizuru",
    targetAvatar: "",
  },
  {
    id: "t-3",
    fileName: "wallpaper_4k.png",
    fileSize: "12 MB",
    progress: 100,
    speed: "Done",
    direction: "send",
    state: "completed",
    targetUserName: "yuna_ayase",
    targetAvatar: "",
  },
];

function getPeerPosition(id: string, index: number) {
  const cols = 3;
  const cellWidth = 100 / cols;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const jitterX = (Math.sin(seed * 1.5) * 0.5 + 0.5) * (cellWidth * 0.5);
  const jitterY = (Math.cos(seed * 1.5) * 0.5 + 0.5) * 30;
  return {
    left: `${col * cellWidth + jitterX + cellWidth * 0.15}%`,
    top: `${row * 35 + jitterY + 5}%`,
  };
}

function getSystemIcon(system: string) {
  switch (system) {
    case "iOS": return "phone_iphone";
    case "Android": return "phone_android";
    case "macOS": return "laptop_mac";
    case "Windows": return "desktop_windows";
    case "Web": return "language";
    case "Instance": return "dns";
    default: return "devices";
  }
}

export default function DriveDropPage() {
  const { t } = useI18n();
  const userStore = useUserStore();
  const systemStore = useSystemStore();
  const [isDropping, setIsDropping] = useState(false);
  const [tasks, setTasks] = useState(mockTasks);

  const toggleTaskPause = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (t.state === "active") return { ...t, state: "paused" as const, speed: "0 KB/s" };
        if (t.state === "paused") return { ...t, state: "active" as const, speed: "22.5 MB/s" };
        return t;
      })
    );
  };

  const myDevice = {
    deviceName: systemStore.hostInfo?.hostname || t("drive.scanningDevice"),
    pubId: "pub-8f2e-9d1a-4c5b-39c5",
    platform: systemStore.hostInfo?.platform || t("drive.detectingOS"),
    icon: getSystemIcon(systemStore.hostInfo?.platform || ""),
  };

  return (
    <div
      className="relative flex-1 overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDropping(true); }}
      onDragLeave={() => setIsDropping(false)}
      onDrop={(e) => { e.preventDefault(); setIsDropping(false); }}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400 rounded-full blur-[120px]" />
      </div>

      {/* Identity Block */}
      <div className="absolute top-6 left-6 z-20 animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 p-5 rounded-3xl shadow-xl flex items-center gap-4 group">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-cyan-500/20 group-hover:ring-cyan-500/40 transition-all shadow-md">
              {userStore.avatar ? (
                <Image src={userStore.avatar} width={64} height={64} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
                  <Icon name="person" className="text-cyan-500" fontSize={28} />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md border border-gray-100 dark:border-gray-700">
              <Icon name={myDevice.icon} fontSize={14} className="text-gray-700 dark:text-gray-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-gray-900 dark:text-white">{userStore.username}</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">{t("drive.owner")}</span>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">{myDevice.deviceName}</span>
            <div className="mt-2 flex items-center gap-1.5 py-1 px-2.5 bg-black/5 dark:bg-white/5 rounded-full w-fit max-w-[200px]">
              <Icon name="fingerprint" fontSize={14} className="text-cyan-500 shrink-0" />
              <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-gray-500 truncate">{myDevice.pubId}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md w-fit">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{myDevice.platform}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Peers */}
      <div className="absolute left-6 bottom-6 top-48 right-[420px] z-10 pointer-events-none overflow-hidden hidden md:block">
        {mockPeers.map((peer, index) => (
          <div
            key={peer.id}
            className="absolute pointer-events-auto transition-all duration-700 group cursor-pointer"
            style={getPeerPosition(peer.id, index)}
          >
            <div className="flex flex-col items-center gap-3 hover:scale-110 active:scale-95 transition-all duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-cyan-500/50 transition-all shadow-xl relative z-10">
                  {peer.avatar ? (
                    <Image src={peer.avatar} width={80} height={80} className="w-full h-full object-cover" alt={peer.displayName} />
                  ) : (
                    <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
                      <Icon name="person" className="text-cyan-500" fontSize={28} />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg border border-gray-100 dark:border-gray-700 z-20">
                  <Icon name={getSystemIcon(peer.system)} fontSize={14} className="text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center -mt-1 py-1.5 px-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/30 shadow-sm opacity-0 group-hover:opacity-100 transition-all group-hover:translate-y-1">
                <span className="text-[13px] font-black text-gray-900 dark:text-white whitespace-nowrap">{peer.displayName}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{peer.system}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className={`text-[9px] font-bold uppercase ${peer.isRemote ? "text-amber-500" : "text-cyan-500"}`}>
                    {peer.isRemote ? t("drive.remote") : t("drive.local")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Panel */}
      <div className="absolute top-0 right-0 bottom-0 w-[400px] z-30 flex flex-col animate-[slideLeft_0.6s_ease-out] hidden md:flex">
        <div className="flex-1 bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl border-l border-white/20 dark:border-gray-800/50 shadow-2xl rounded-l-[40px] flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="px-8 pt-8 pb-4 shrink-0 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{t("drive.activeTransfer")}</h3>
              <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-1">{t("drive.activityLog")}</span>
            </div>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors">
              <Icon name="settings" fontSize={18} />
            </button>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl border border-white/40 dark:border-gray-700/30 p-4 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {task.targetAvatar ? (
                        <Image src={task.targetAvatar} width={40} height={40} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
                          <Icon name="person" className="text-cyan-500" fontSize={16} />
                        </div>
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 ${
                        task.direction === "send" ? "bg-cyan-500 text-white" : "bg-teal-500 text-white"
                      }`}
                    >
                      <Icon name={task.direction === "send" ? "upload" : "download"} fontSize={12} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{task.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{task.fileSize}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <span className={`text-[10px] font-bold ${task.state === "active" ? "text-cyan-500" : "text-gray-400"}`}>
                        {task.speed}
                      </span>
                    </div>
                  </div>
                  {(task.state === "active" || task.state === "paused") && (
                    <button
                      onClick={() => toggleTaskPause(task.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors shrink-0"
                    >
                      <Icon name={task.state === "active" ? "pause" : "play_arrow"} fontSize={16} />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="relative h-2.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                      task.state === "completed"
                        ? "bg-teal-500"
                        : task.state === "paused"
                          ? "bg-amber-400"
                          : "bg-cyan-500 shadow-[0_0_12px_rgba(57,197,187,0.4)]"
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{task.state}</span>
                  <span className="text-[10px] font-bold text-cyan-500">{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Panel Footer */}
          <div className="p-8 border-t border-white/10 dark:border-gray-800/30 bg-black/5 dark:bg-white/5 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t("drive.storageUsed")}</span>
              <span className="text-[11px] font-bold text-gray-900 dark:text-white tracking-wider">3.5 GB / 16 GB</span>
            </div>
            <div className="h-1.5 w-full bg-gray-300/30 dark:bg-gray-700/30 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400/50 rounded-full shadow-[0_0_8px_rgba(57,197,187,0.3)]" style={{ width: "21.6%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Drop Overlay */}
      {isDropping && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center bg-cyan-500/10 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 animate-bounce">
            <div className="w-32 h-32 rounded-[40px] border-4 border-dashed border-cyan-500 flex items-center justify-center bg-cyan-500/20">
              <Icon name="cloud_upload" className="text-cyan-500" fontSize={56} />
            </div>
            <h2 className="text-4xl font-black text-cyan-500 drop-shadow-[0_0_20px_rgba(57,197,187,0.8)] tracking-widest">
              {t("drive.dropToAirdrop")}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}
