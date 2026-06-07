import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSystemStore } from '~/stores/system'

export interface User {
  avatar: string
  displayName: string
  username: string
  instance?: string
}

export interface TimelinePost {
  id: string
  author: User
  createdAt: Date | string
  content: string
  replyTo?: {
    author: User
  }
  metrics: {
    replies: number
    reposts: number
    reactions: number
  }
}

export const useTimelineStore = defineStore('timeline', () => {
  const systemStore = useSystemStore()
  const cacheKey = 'asgt_timeline_cache'

  function loadFromCache(): TimelinePost[] {
    if (import.meta.client) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch (e) {
          console.error('Failed to parse timeline cache:', e)
        }
      }
    }
    return []
  }

  function saveToCache(newPosts: TimelinePost[]) {
    if (import.meta.client && newPosts.length > 0) {
      localStorage.setItem(cacheKey, JSON.stringify(newPosts))
    }
  }

  const posts = ref<TimelinePost[]>(loadFromCache())

  async function fetchTimeline(endpoint: string) {
    // If offline, immediately return cache
    if (!systemStore.isBackendOnline && !systemStore.isDevMode) {
      const cached = loadFromCache()
      posts.value = cached
      return cached
    }

    try {
      const api = useApi()
      const response = await api.get(endpoint, {
        query: { limit: 20 }
      })

      const newPosts = response as TimelinePost[]
      posts.value = newPosts

      // Update cache
      saveToCache(newPosts)

      return newPosts
    } catch (err) {
      console.error('Failed to fetch timeline:', err)

      // Notify system of potential offline state
      systemStore.triggerOfflineFallback()

      // Fallback to cache on error
      const cached = loadFromCache()
      posts.value = cached
      return cached
    }
  }

  return {
    posts,
    fetchTimeline
  }
})
