import { create } from "zustand";

const MAX_CACHE_SIZE = 10;

interface SoundManagerState {
  audioContext: AudioContext | null;
  soundCache: Map<string, AudioBuffer>;
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
  soundCache: new Map(),
  isPreloaded: false,
  isPreloading: false,

  soundRegistry: {
    ca: "/sounds/AyaxYuna/ca.wav",
    sys_error: "/sounds/System/Error.wav",
    sys_net_restored: "/sounds/AyaxYuna/sys_net_restored.wav",
    message_sent: "/sounds/System/MessageSent.wav",
    message_received: "/sounds/System/MessageReceived.wav",
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
    if (get().soundCache.has(name)) {
      return get().soundCache.get(name) ?? null;
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

      set((state) => {
        const newCache = new Map(state.soundCache);
        if (newCache.size >= MAX_CACHE_SIZE) {
          const firstKey = newCache.keys().next().value;
          if (firstKey) newCache.delete(firstKey);
        }
        newCache.set(name, audioBuffer);
        return { soundCache: newCache };
      });

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
    const buffer = get().soundCache.get(name) || (await get().loadSound(name, registry[name]));
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
