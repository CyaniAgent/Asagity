<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSystemStore } from '~/stores/system'

const route = useRoute()
const systemStore = useSystemStore()

interface User {
  avatar: string
  displayName: string
  username: string
  instance?: string
}

interface TimelinePost {
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

const timelineType = computed(() => {
  const tab = route.query.tab as string
  if (tab === 'followed') return 'home'
  if (tab === 'local') return 'local'
  return 'public'
})

const _timelineTitle = computed(() => {
  switch (timelineType.value) {
    case 'home': return '已关注'
    case 'local': return '仅本实例'
    default: return '动态'
  }
})

const _timelineIcon = computed(() => {
  switch (timelineType.value) {
    case 'home': return 'i-material-symbols-person'
    case 'local': return 'i-material-symbols-dns'
    default: return 'i-material-symbols-public'
  }
})

const timelineEndpoint = computed(() => {
  switch (timelineType.value) {
    case 'home': return '/api/timeline/home'
    case 'local': return '/api/timeline/local'
    default: return '/api/timeline/public'
  }
})

const { data: timelineData, pending: timelineLoading } = useAsyncData(
  `timeline-${timelineType.value}`,
  async () => {
    if (systemStore.isDevMode) {
      return [] as TimelinePost[]
    }

    try {
      const api = useApi()
      const response = await api.get(timelineEndpoint.value, {
        query: { limit: 20 }
      })
      return response as TimelinePost[]
    } catch (err) {
      console.error('Failed to fetch timeline:', err)
      return [] as TimelinePost[]
    }
  },
  {
    default: () => [] as TimelinePost[],
    watch: [timelineType]
  }
)
</script>

<template>
  <div class="w-full h-full animate-[fade-in_0.4s_ease-out] -m-6 lg:-m-10 flex flex-col">
    <!-- Timeline full width container -->
    <div class="flex flex-col min-w-0 bg-white dark:bg-gray-900 w-full h-full">
      <!-- Post Stream -->
      <div class="flex flex-col min-h-screen">
        <template v-if="timelineLoading">
          <div class="flex items-center justify-center py-24">
            <UIcon
              name="i-material-symbols-progress-activity"
              class="animate-spin text-cyan-500 w-10 h-10"
            />
          </div>
        </template>
        <template v-else-if="!timelineData?.length">
          <div class="py-20">
            <AppEmptyState
              title="动态板块空空如也"
              description="暂无动态，快去关注一些有趣的用户吧！"
              icon="i-material-symbols-dynamic-feed"
            />
          </div>
        </template>
        <template v-else>
          <AppPostItem
            v-for="post in timelineData"
            :key="post.id"
            :post="post"
            class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
