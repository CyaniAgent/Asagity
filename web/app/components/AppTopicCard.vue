<script setup lang="ts">
import { computed, ref } from 'vue'
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'
import { useColorMode } from '@vueuse/core'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

interface TopicPost {
  id: string
  author: {
    avatar: string
    displayName: string
    username: string
  }
  createdAt: Date | string
  content: string
}

interface TopicProps {
  topic: {
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
  expanded?: boolean
}

const props = defineProps<TopicProps>()
const emit = defineEmits<{
  click: [topic: TopicProps['topic']]
}>()

const colorMode = useColorMode()
const isExpanded = ref(props.expanded || false)

// Smart time calculation
const smartTime = computed(() => {
  const date = new Date(props.topic.updatedAt)
  const now = new Date()

  const seconds = differenceInSeconds(now, date)
  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)
  const months = differenceInMonths(now, date)
  const years = differenceInYears(now, date)

  if (seconds < 60) return `${seconds}秒前`
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  if (months < 12) return `${months}个月前`
  return `${years}年前`
})

const chartOption = computed(() => {
  const isDark = colorMode.value === 'dark'
  const lineColor = '#39C5BB'
  const areaColor = 'rgba(57, 197, 187, 0.15)'

  return {
    grid: {
      top: 4,
      right: 4,
      bottom: 4,
      left: 4
    },
    xAxis: {
      type: 'category',
      show: false,
      data: ['00', '04', '08', '12', '16', '20', '24']
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: lineColor,
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: areaColor },
            { offset: 1, color: 'transparent' }
          ]
        }
      },
      data: props.topic.activityData
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#1f2937',
        fontSize: 11
      },
      formatter: (params: { value: number }[]) => {
        return `${params[0].value} posts`
      }
    },
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut'
  }
})

function handleClick() {
  isExpanded.value = !isExpanded.value
  emit('click', props.topic)
}
</script>

<template>
  <div
    class="group relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 shadow-sm hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
    :class="isExpanded ? 'ring-2 ring-cyan-400/50' : ''"
    @click="handleClick"
  >
    <div class="p-5">
      <!-- Top Row: Name + Time -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">#</span>
          <h3 class="text-[18px] font-black text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">
            {{ topic.displayName || topic.name }}
          </h3>
          <span class="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[11px] font-bold rounded-full">
            {{ topic.postsCount }} posts
          </span>
        </div>
        <div class="flex items-center gap-1.5 text-[12px] text-gray-400">
          <UIcon
            name="i-material-symbols-update"
            class="w-3.5 h-3.5"
          />
          <span>{{ smartTime }}</span>
        </div>
      </div>

      <!-- Bottom Row: Last Poster + Chart -->
      <div class="flex items-center justify-between">
        <!-- Last Poster -->
        <div class="flex items-center gap-2">
          <UAvatar
            :src="topic.lastPoster.avatar"
            size="xs"
            class="ring-1 ring-white/50 dark:ring-gray-700/50"
          />
          <div class="flex flex-col">
            <span class="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
              {{ topic.lastPoster.displayName }}
            </span>
            <span class="text-[9px] text-gray-400">最新活跃</span>
          </div>
        </div>

        <!-- Mini Activity Chart -->
        <div class="w-24 h-10">
          <VChart
            :option="chartOption"
            autoresize
            class="w-full h-full"
          />
        </div>
      </div>
    </div>

    <!-- Hover Glow Effect -->
    <div class="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-cyan-500/5 to-transparent" />

    <!-- Expanded Posts Panel -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[800px]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-h-[800px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="isExpanded && topic.posts && topic.posts.length > 0"
        class="border-t border-white/20 dark:border-gray-800/50 overflow-hidden"
      >
        <div class="p-4 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
          <AppPostItem
            v-for="post in topic.posts"
            :key="post.id"
            :post="post"
            class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-xl"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
