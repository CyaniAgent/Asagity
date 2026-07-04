import { create } from "zustand";
import type { TimelinePost } from "@/types/models";
import { useSystemStore } from "./system";

interface TimelineState {
  posts: TimelinePost[];
  fetchTimeline: (endpoint: string) => Promise<TimelinePost[]>;
}

const CACHE_KEY = "asgt_timeline_cache";

function loadFromCache(): TimelinePost[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    console.error("Failed to parse timeline cache");
  }
  return [];
}

function saveToCache(posts: TimelinePost[]) {
  if (typeof window !== "undefined" && posts.length > 0) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
  }
}

export const useTimelineStore = create<TimelineState>()((set) => ({
  posts: [],

  fetchTimeline: async (endpoint) => {
    const systemState = useSystemStore.getState();

    if (!systemState.isBackendOnline && !systemState.isDevMode) {
      const cached = loadFromCache();
      set({ posts: cached });
      return cached;
    }

    try {
      const { api } = await import("@/lib/api");
      const response = await api.get<TimelinePost[]>(endpoint, {
        query: { limit: "20" },
      });

      set({ posts: response });
      saveToCache(response);

      return response;
    } catch (err) {
      console.error("Failed to fetch timeline:", err);

      useSystemStore.getState().triggerOfflineFallback();

      const cached = loadFromCache();
      set({ posts: cached });
      return cached;
    }
  },
}));
