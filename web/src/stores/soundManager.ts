import { create } from "zustand";

interface SoundCache {
  [key: string]: AudioBuffer | null;
}

interface SoundManagerState {
  audioContext: AudioContext | null;
  soundCache: SoundCache;
  isPreloaded: boolean;
  isPreloading: boolean;
  soundRegistry: Record<string, string>;
  getAudioContext: () => Promise<AudioContext>;
  loadSound: (name: string, url: string) => Promise<AudioBuffer | null>;
  preloadSounds: (exclude?: string[]) => Promise<void>;
  play: (name: string) => Promise<void>;
  playIfAvailable: (name: string) => void;
}

export const useSoundManagerStore = create<SoundManagerState>()((set, get) => ({
  audioContext: null,
  soundCache: {},
  isPreloaded: false,
  isPreloading: false,

  soundRegistry: {
    ca: "/sounds/AyaseYuna/ca.wav",
    sys_error: "/sounds/AyaseYuna/sys_error.wav",
    sys_net_restored: "/sounds/AyaseYuna/sys_net_restored.wav",
    message_sent: "/sounds/Defaults/MessageSent.ogg",
    message_received: "/sounds/Defaults/MessageReceived.ogg",
  },

  getAudioContext: async () => {
    if (!get().audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      set({ audioContext: new AudioCtx() });
    }
    const ctx = get().audioContext!;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx;
  },

  loadSound: async (name, url) => {
    if (get().soundCache[name]) {
      return get().soundCache[name];
    }

    try {
      const ctx = await get().getAudioContext();
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`SoundManager: Failed to fetch ${url}, status=${response.status}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      set((state) => ({
        soundCache: { ...state.soundCache, [name]: audioBuffer },
      }));
      return audioBuffer;
    } catch (err) {
      console.warn(`SoundManager: Failed to load sound ${name}:`, err);
      return null;
    }
  },

  preloadSounds: async (exclude = []) => {
    if (get().isPreloaded || get().isPreloading) return;
    set({ isPreloading: true });

    const registry = get().soundRegistry;
    const promises = Object.entries(registry)
      .filter(([name]) => !exclude.includes(name))
      .map(async ([name, url]) => {
        await get().loadSound(name, url);
      });

    await Promise.allSettled(promises);

    set({ isPreloaded: true, isPreloading: false });
  },

  play: async (name) => {
    const registry = get().soundRegistry;
    const buffer = get().soundCache[name] || (await get().loadSound(name, registry[name]));
    if (!buffer) {
      console.warn(`SoundManager: Cannot play ${name} - not loaded`);
      return;
    }

    const ctx = await get().getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  },

  playIfAvailable: (name) => {
    get().play(name).catch((err) => console.warn(`SoundManager: Play error for ${name}:`, err));
  },
}));
