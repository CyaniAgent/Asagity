<script setup lang="ts">
import { ref, computed } from 'vue'
import { subHours, subMinutes, subDays } from 'date-fns'

definePageMeta({
  layout: 'default'
})

interface TopicPost {
  id: string
  author: {
    avatar: string
    displayName: string
    username: string
    instance?: string
  }
  createdAt: Date | string
  content: string
  metrics: {
    replies: number
    reposts: number
    reactions: number
  }
}

interface Topic {
  id: string
  name: string
  displayName?: string
  updatedAt: Date | string
  postsCount: number
  lastPoster: {
    avatar: string
    displayName: string
    username: string
  }
  activityData: number[]
  posts?: TopicPost[]
}

const searchQuery = ref('')
const selectedFilter = ref<'all' | 'hot' | 'recent' | 'trending'>('all')
const expandedTopicId = ref<string | null>(null)

const mockTopics: Topic[] = [
  {
    id: '1',
    name: 'Asagity',
    displayName: 'Asagity',
    updatedAt: subMinutes(new Date(), 5),
    postsCount: 1247,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/739984?v=4',
      displayName: '绝对领域SK',
      username: 'syskuku'
    },
    activityData: [12, 8, 15, 23, 18, 32, 45],
    posts: [
      {
        id: 'p1',
        author: {
          avatar: 'https://avatars.githubusercontent.com/u/739984?v=4',
          displayName: '绝对领域SK',
          username: 'syskuku'
        },
        createdAt: subMinutes(new Date(), 5),
        content: '终于完成了 Asagity 的新功能开发！大家快来试试看 #Asagity $[tada 🎉]',
        metrics: { replies: 23, reposts: 45, reactions: 128 }
      },
      {
        id: 'p2',
        author: {
          avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
          displayName: 'Little',
          username: 'Little'
        },
        createdAt: subMinutes(new Date(), 15),
        content: '这个平台真的很棒！#Asagity',
        metrics: { replies: 5, reposts: 12, reactions: 34 }
      }
    ]
  },
  {
    id: '2',
    name: '日常',
    displayName: '日常',
    updatedAt: subHours(new Date(), 1),
    postsCount: 856,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
      displayName: 'Yuna',
      username: 'yuna_ayase'
    },
    activityData: [20, 25, 18, 30, 28, 35, 22],
    posts: [
      {
        id: 'p3',
        author: {
          avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
          displayName: 'Yuna',
          username: 'yuna_ayase'
        },
        createdAt: subHours(new Date(), 1),
        content: '今天天气真不错喵~ 想出去散步。#日常 $[shake 🐾]',
        metrics: { replies: 8, reposts: 2, reactions: 15 }
      }
    ]
  },
  {
    id: '3',
    name: 'Gakumasu',
    displayName: 'Gakumasu',
    updatedAt: subHours(new Date(), 3),
    postsCount: 432,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/10?v=4',
      displayName: '静流',
      username: 'shizuru_official'
    },
    activityData: [5, 8, 12, 15, 10, 18, 20],
    posts: [
      {
        id: 'p4',
        author: {
          avatar: 'https://avatars.githubusercontent.com/u/10?v=4',
          displayName: '静流',
          username: 'shizuru_official',
          instance: 'gakumasu.club'
        },
        createdAt: subHours(new Date(), 3),
        content: 'Gakumasu 演唱会太棒了！#Gakumasu $[star ⭐]',
        metrics: { replies: 45, reposts: 89, reactions: 234 }
      }
    ]
  },
  {
    id: '4',
    name: 'maimai',
    displayName: 'maimai',
    updatedAt: subDays(new Date(), 1),
    postsCount: 128,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/11?v=4',
      displayName: 'Miku_39',
      username: 'miku39'
    },
    activityData: [2, 5, 3, 8, 6, 4, 7],
    posts: []
  },
  {
    id: '5',
    name: 'Vocaloid',
    displayName: 'Vocaloid',
    updatedAt: subDays(new Date(), 2),
    postsCount: 2048,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/12?v=4',
      displayName: 'Vocaloid Producer',
      username: 'vocalo_p'
    },
    activityData: [45, 52, 48, 63, 58, 72, 68],
    posts: []
  },
  {
    id: '6',
    name: '技术分享',
    displayName: '技术分享',
    updatedAt: subHours(new Date(), 6),
    postsCount: 316,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/4?v=4',
      displayName: 'DevMaster',
      username: 'devmaster'
    },
    activityData: [8, 12, 10, 15, 18, 14, 20],
    posts: []
  },
  {
    id: '7',
    name: '游戏',
    displayName: '游戏',
    updatedAt: subHours(new Date(), 12),
    postsCount: 567,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/5?v=4',
      displayName: 'GamerPro',
      username: 'gamerpro'
    },
    activityData: [15, 20, 18, 25, 30, 22, 28],
    posts: []
  },
  {
    id: '8',
    name: '音乐',
    displayName: '音乐',
    updatedAt: subMinutes(new Date(), 30),
    postsCount: 892,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/6?v=4',
      displayName: 'MusicLover',
      username: 'musiclvr'
    },
    activityData: [18, 25, 22, 30, 35, 28, 40],
    posts: []
  },
  {
    id: '9',
    name: '旅行',
    displayName: '旅行',
    updatedAt: subDays(new Date(), 3),
    postsCount: 234,
    lastPoster: {
      avatar: 'https://avatars.githubusercontent.com/u/7?v=4',
      displayName: 'TravelBug',
      username: 'travelbug'
    },
    activityData: [3, 5, 4, 6, 8, 5, 7],
    posts: []
  }
]

const filteredTopics = computed(() => {
  let topics = [...mockTopics]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    topics = topics.filter(t =>
      t.name.toLowerCase().includes(query)
      || t.displayName?.toLowerCase().includes(query)
    )
  }

  // Sort filter
  switch (selectedFilter.value) {
    case 'hot':
      return topics.sort((a, b) => b.postsCount - a.postsCount)
    case 'recent':
      return topics.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    case 'trending':
      return topics.sort((a, b) => {
        const aRecent = a.activityData.slice(-3).reduce((s, v) => s + v, 0)
        const bRecent = b.activityData.slice(-3).reduce((s, v) => s + v, 0)
        return bRecent - aRecent
      })
    default:
      return topics
  }
})

const filterOptions = [
  { value: 'all', label: '全部', icon: 'i-material-symbols-apps' },
  { value: 'hot', label: '最热', icon: 'i-material-symbols-local-fire-department' },
  { value: 'recent', label: '最新', icon: 'i-material-symbols-schedule' },
  { value: 'trending', label: '趋势', icon: 'i-material-symbols-trending-up' }
]

function handleTopicClick(topic: Topic) {
  expandedTopicId.value = expandedTopicId.value === topic.id ? null : topic.id
}

const totalTopics = computed(() => mockTopics.length)
const totalPosts = computed(() => mockTopics.reduce((sum, t) => sum + t.postsCount, 0))
</script>

<template>
  <div class="max-w-[1200px] mx-auto w-full animate-[fade-in_0.4s_ease-out]">
    <!-- Search & Filter -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <!-- Search -->
      <div class="flex-1 relative">
        <UIcon
          name="i-material-symbols-search"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索话题..."
          class="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/30 dark:border-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
        >
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-1 p-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/30 dark:border-gray-800/50">
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          :class="selectedFilter === filter.value
            ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          @click="selectedFilter = filter.value as typeof selectedFilter"
        >
          <UIcon
            :name="filter.icon"
            class="w-4 h-4"
          />
          <span class="hidden sm:inline">{{ filter.label }}</span>
        </button>
      </div>
    </div>

    <!-- Topics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AppTopicCard
        v-for="topic in filteredTopics"
        :key="topic.id"
        :topic="topic"
        :expanded="expandedTopicId === topic.id"
        @click="handleTopicClick"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredTopics.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <UIcon
        name="i-material-symbols-search-off"
        class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
      />
      <h3 class="text-lg font-bold text-gray-500 mb-2">
        没有找到相关话题
      </h3>
      <p class="text-sm text-gray-400">
        试试其他关键词或筛选条件
      </p>
    </div>

    <!-- Loading More (placeholder) -->
    <div
      v-if="filteredTopics.length > 0"
      class="mt-8 flex justify-center"
    >
      <UButton
        label="加载更多"
        color="neutral"
        variant="soft"
        icon="i-material-symbols-keyboard-arrow-down"
        class="rounded-full px-8"
      />
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
