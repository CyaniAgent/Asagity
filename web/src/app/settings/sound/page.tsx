"use client";

import { useState } from "react";
import { useMusicStore } from "@/stores/music";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-cyan-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

export default function SoundSettingsPage() {
  const { t } = useI18n();
  const musicStore = useMusicStore();
  const [volume, setVolume] = useState(75);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);

  return (
    <div className="max-w-[700px] mx-auto p-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="volume_up" className="text-white" fontSize={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.sound")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.manageSound")}</p>
        </div>
      </div>

      {/* Master Volume */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="tune" className="text-cyan-500" fontSize={18} />
            {t("settings.masterVolume")}
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <Icon name="volume_down" className="text-gray-400" fontSize={20} />
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-cyan-500"
            />
            <Icon name="volume_up" className="text-gray-400" fontSize={20} />
          </div>
          <div className="text-center text-sm font-bold text-cyan-500">{volume}%</div>
        </div>
      </section>

      {/* Sound Effects */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="music_note" className="text-cyan-500" fontSize={18} />
            {t("settings.soundEffects")}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.interfaceSounds")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.interfaceSoundsDesc")}</div>
            </div>
            <Toggle enabled={sfxEnabled} onChange={setSfxEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("settings.backgroundMusic")}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("settings.backgroundMusicDesc")}</div>
            </div>
            <Toggle enabled={bgmEnabled} onChange={setBgmEnabled} />
          </div>
        </div>
      </section>

      {/* Now Playing */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="equalizer" className="text-cyan-500" fontSize={18} />
            {t("settings.nowPlaying")}
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <img
              src={musicStore.currentTrack.albumArt}
              className="w-14 h-14 rounded-xl object-cover shadow-sm"
              alt="Art"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {musicStore.currentTrack.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {musicStore.currentTrack.artist}
              </div>
            </div>
            <button
              onClick={() => musicStore.togglePlay()}
              className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
            >
              <Icon name={musicStore.isPlaying ? "pause" : "play_arrow"} fontSize={20} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
