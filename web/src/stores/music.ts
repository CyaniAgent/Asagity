import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lrc } from "lrc-kit";

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  url: string;
  bitrate?: number;
  sampleRate?: number;
  container?: string;
  codec?: string;
  year?: number;
  album?: string;
}

export interface LyricLine {
  timestamp: number;
  text: string;
  rawLines: string[];
}

interface MusicState {
  isPlaying: boolean;
  progress: number;
  volume: number;
  currentTrack: Track;
  lyrics: LyricLine[];
  currentLyricIndex: number;
  isLoading: boolean;
  shuffle: boolean;
  loopMode: "none" | "one" | "all";
  playlist: Track[];
  currentIndex: number;
  isLyricsWindowOpen: boolean;
  isPlaylistWindowOpen: boolean;
  themeColor: string;
  textColor: string;
  progressPercentage: number;
  audioQuality: string;
  initAudio: () => void;
  seek: (time: number) => void;
  togglePlay: () => void;
  setProgress: (value: number) => void;
  setVolume: (value: number) => void;
  fetchMetadata: (url: string) => Promise<void>;
  toggleShuffle: () => void;
  toggleLoopMode: () => void;
  playNext: (isAuto?: boolean) => Promise<void>;
  playPrev: () => Promise<void>;
  setTrackByIndex: (index: number) => Promise<void>;
  setPlaylist: (tracks: Track[], startIndex?: number) => Promise<void>;
}

const DEFAULT_PLAYLIST: Track[] = [
  { id: "track-0", title: "MusicTest0", artist: "Local Track", albumArt: "", duration: 0, url: "/sounds/MusicTest0.mp3" },
  { id: "track-1", title: "MusicTest1", artist: "Local Track", albumArt: "", duration: 0, url: "/sounds/MusicTest1.mp3" },
  { id: "track-2", title: "MusicTest2", artist: "Local Track", albumArt: "", duration: 0, url: "/sounds/MusicTest2.mp3" },
];

const DEFAULT_TRACK: Track = {
  id: "loading",
  title: "Loading...",
  artist: "Loading...",
  albumArt: "https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg",
  duration: 0,
  url: "/sounds/MusicTest0.mp3",
};

let audioElement: HTMLAudioElement | null = null;

function parseLrc(lrcContent: string): LyricLine[] {
  try {
    const parsed = Lrc.parse(lrcContent);
    const grouped: Record<number, string[]> = {};

    for (const line of parsed.lyrics) {
      const ts = line.timestamp;
      if (!grouped[ts]) grouped[ts] = [];
      grouped[ts].push(line.content);
    }

    return Object.entries(grouped)
      .map(([timestamp, lines]) => ({
        timestamp: parseFloat(timestamp),
        text: lines.join("\n"),
        rawLines: lines,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [{ timestamp: 0, text: lrcContent, rawLines: [lrcContent] }];
  }
}

function getAudioQuality(track: Track): string {
  const { container, bitrate } = track;
  if (!container) return "Unknown";

  const c = container.toUpperCase();
  const lossless = ["FLAC", "WAV", "ALAC", "AIFF", "MONKEY'S AUDIO"];
  if (lossless.includes(c)) {
    if (track.sampleRate && track.sampleRate >= 96000) return "Hi-Res";
    return "Lossless";
  }

  if (c === "MPEG" || c === "ADTS" || c === "M4A" || c === "MP4") {
    if (!bitrate) return "Unknown";
    const kbps = bitrate / 1000;
    if (kbps >= 320) return "HQ";
    if (kbps > 128) return "Standard";
    return "Low";
  }

  return c;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      progress: 0,
      volume: 70,
      currentTrack: DEFAULT_TRACK,
      lyrics: [],
      currentLyricIndex: -1,
      isLoading: false,
      shuffle: false,
      loopMode: "none",
      playlist: DEFAULT_PLAYLIST,
      currentIndex: 0,
      isLyricsWindowOpen: false,
      isPlaylistWindowOpen: false,
      themeColor: "#39C5BB",
      textColor: "#FFFFFF",

      get progressPercentage() {
        const state = get();
        if (!state.currentTrack.duration) return 0;
        return (state.progress / state.currentTrack.duration) * 100;
      },

      get audioQuality() {
        return getAudioQuality(get().currentTrack);
      },

      initAudio: () => {
        if (typeof window === "undefined" || audioElement) return;

        audioElement = new Audio();
        audioElement.volume = get().volume / 100;

        audioElement.addEventListener("timeupdate", () => {
          if (!audioElement) return;
          const currentTime = audioElement.currentTime;
          set({ progress: currentTime });

          const lyrics = get().lyrics;
          if (lyrics.length === 0) return;
          const index = lyrics.findIndex((line, i) => {
            const next = lyrics[i + 1];
            return currentTime >= line.timestamp && (!next || currentTime < next.timestamp);
          });
          set({ currentLyricIndex: index });
        });

        audioElement.addEventListener("play", () => set({ isPlaying: true }));
        audioElement.addEventListener("pause", () => set({ isPlaying: false }));
        audioElement.addEventListener("ended", () => get().playNext(true));

        get().fetchMetadata(get().currentTrack.url);
      },

      seek: (time) => {
        if (!audioElement) return;
        audioElement.currentTime = time;
        set({ progress: time });
      },

      togglePlay: () => {
        if (!audioElement) return;
        if (get().isPlaying) {
          audioElement.pause();
        } else {
          audioElement.play().catch(console.error);
        }
      },

      setProgress: (value) => {
        if (!audioElement) return;
        audioElement.currentTime = value;
        set({ progress: value });
      },

      setVolume: (value) => {
        set({ volume: value });
        if (audioElement) {
          audioElement.volume = value / 100;
        }
      },

      fetchMetadata: async (url) => {
        set({ isLoading: true });
        try {
          const { parseBlob } = await import("music-metadata");
          const response = await fetch(url);
          const blob = await response.blob();
          const metadata = await parseBlob(blob);

          let albumArt = "https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg";

          if (metadata.common.picture && metadata.common.picture.length > 0) {
            const pic = metadata.common.picture[0];
            if (pic) {
              const uint8Array = new Uint8Array(pic.data);
              const imgBlob = new Blob([uint8Array], { type: pic.format });
              albumArt = URL.createObjectURL(imgBlob);
            }
          }

          const newTrack: Track = {
            id: url,
            title: metadata.common.title || "Unknown Title",
            artist: metadata.common.artist || "Unknown Artist",
            albumArt,
            duration: metadata.format.duration || 0,
            url,
            bitrate: metadata.format.bitrate,
            sampleRate: metadata.format.sampleRate,
            container: metadata.format.container,
            codec: metadata.format.codec,
            year: metadata.common.year,
            album: metadata.common.album,
          };

          set({ currentTrack: newTrack });

          if (typeof window !== "undefined") {
            const img = new Image();
            img.src = albumArt;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) return;
              canvas.width = 10;
              canvas.height = 10;
              ctx.drawImage(img, 0, 0, 10, 10);

              const data = ctx.getImageData(0, 0, 10, 10).data;
              let r = 0, g = 0, b = 0;
              for (let i = 0; i < data.length; i += 4) {
                r += data[i] ?? 0;
                g += data[i + 1] ?? 0;
                b += data[i + 2] ?? 0;
              }
              const count = data.length / 4;
              r = Math.floor(r / count);
              g = Math.floor(g / count);
              b = Math.floor(b / count);

              const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              set({
                themeColor: `rgb(${r}, ${g}, ${b})`,
                textColor: luminance > 140 ? "#000000" : "#FFFFFF",
              });
            };
          }

          if (metadata.common.lyrics && metadata.common.lyrics.length > 0) {
            const lyric = metadata.common.lyrics[0];
            if (lyric && lyric.text) {
              set({ lyrics: parseLrc(lyric.text) });
            } else {
              set({ lyrics: [] });
            }
          } else {
            set({ lyrics: [] });
          }

          if (audioElement) {
            audioElement.src = url;
          }
        } catch (error) {
          console.error("Music metadata error:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

      toggleLoopMode: () =>
        set((state) => {
          const modes: ("none" | "one" | "all")[] = ["none", "one", "all"];
          const nextIdx = (modes.indexOf(state.loopMode) + 1) % modes.length;
          return { loopMode: modes[nextIdx] };
        }),

      playNext: async (isAuto = false) => {
        const state = get();
        if (state.loopMode === "one" && isAuto) {
          if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(console.error);
          }
          return;
        }

        if (state.playlist.length === 0) return;

        let nextIdx = state.currentIndex;
        if (state.shuffle) {
          if (state.playlist.length > 1) {
            do {
              nextIdx = Math.floor(Math.random() * state.playlist.length);
            } while (nextIdx === state.currentIndex);
          }
        } else {
          nextIdx = state.currentIndex + 1;
          if (nextIdx >= state.playlist.length) {
            if (state.loopMode === "all") {
              nextIdx = 0;
            } else {
              set({ isPlaying: false });
              return;
            }
          }
        }

        await get().setTrackByIndex(nextIdx);
      },

      playPrev: async () => {
        const state = get();
        if (state.playlist.length === 0) return;

        let prevIdx = state.currentIndex - 1;
        if (prevIdx < 0) {
          prevIdx = state.loopMode === "all" ? state.playlist.length - 1 : 0;
        }

        await get().setTrackByIndex(prevIdx);
      },

      setTrackByIndex: async (index) => {
        const state = get();
        if (index < 0 || index >= state.playlist.length) return;
        const track = state.playlist[index];
        if (!track) return;
        set({ currentIndex: index });
        await get().fetchMetadata(track.url);
        if (audioElement) {
          audioElement.play().catch(console.error);
        }
      },

      setPlaylist: async (tracks, startIndex = 0) => {
        set({ playlist: tracks });
        await get().setTrackByIndex(startIndex);
      },
    }),
    {
      name: "asagity-music",
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        loopMode: state.loopMode,
        playlist: state.playlist,
        currentIndex: state.currentIndex,
      }),
    }
  )
);
