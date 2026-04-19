<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '#imports'

const colorMode = useColorMode()

// ECharts Theming
const isDark = computed(() => colorMode.value === 'dark')

// 1. Storage Distribution Chart (Doughnut)
const storageOptions = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: isDark.value ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: isDark.value ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
    textStyle: { color: isDark.value ? '#fff' : '#111827' },
    borderRadius: 16,
    padding: [12, 16],
    shadowBlur: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)'
  },
  legend: {
    bottom: '0%',
    icon: 'circle',
    textStyle: { color: isDark.value ? '#9CA3AF' : '#4B5563', fontWeight: 'bold' }
  },
  series: [
    {
      name: '存储用量 (Storage)',
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: isDark.value ? '#111827' : '#ffffff',
        borderWidth: 4
      },
      label: { show: false, position: 'center' },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold',
          color: isDark.value ? '#fff' : '#111827'
        }
      },
      labelLine: { show: false },
      data: [
        { value: 1048, name: '媒体 (Media)', itemStyle: { color: '#39C5BB' } },
        { value: 735, name: '云盘 (Drive)', itemStyle: { color: '#0ea5e9' } },
        { value: 580, name: '数据库 (DB)', itemStyle: { color: '#8b5cf6' } },
        { value: 300, name: '缓存 (Cache)', itemStyle: { color: '#f59e0b' } }
      ]
    }
  ]
}))

// 2. Traffic/Activity Chart (Area Graph)
// Generate 7 days of mock data
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dataLocal = [480, 520, 600, 550, 720, 850, 910]
const dataFed = [210, 240, 280, 310, 390, 420, 480]

const trafficOptions = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: isDark.value ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: isDark.value ? 'rgba(57, 197, 187, 0.3)' : 'rgba(57, 197, 187, 0.2)',
    textStyle: { color: isDark.value ? '#fff' : '#111827' },
    borderRadius: 16,
    padding: [12, 16]
  },
  legend: {
    top: '0%',
    right: '0%',
    icon: 'roundRect',
    textStyle: { color: isDark.value ? '#9CA3AF' : '#4B5563', fontWeight: 'bold' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '5%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: days,
    axisLabel: { color: isDark.value ? '#9CA3AF' : '#6B7280', fontWeight: 'bold' },
    axisLine: { lineStyle: { color: isDark.value ? '#374151' : '#E5E7EB' } },
    splitLine: { show: true, lineStyle: { color: isDark.value ? '#1F2937' : '#F3F4F6' } }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: isDark.value ? '#9CA3AF' : '#6B7280', fontWeight: 'bold' },
    splitLine: { show: true, lineStyle: { color: isDark.value ? '#374151' : '#E5E7EB', type: 'dashed' } }
  },
  series: [
    {
      name: '本站请求 (Local Req)',
      type: 'line',
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: '#39C5BB' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(57, 197, 187, 0.6)' },
            { offset: 1, color: 'rgba(57, 197, 187, 0.05)' }
          ]
        }
      },
      data: dataLocal
    },
    {
      name: '联邦同步 (Fed Sync)',
      type: 'line',
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: '#8b5cf6' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(139, 92, 246, 0.4)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
          ]
        }
      },
      data: dataFed
    }
  ]
}))

// Server Metrics (Mock)
const metrics = [
  { label: '总用户数 (Users)', value: '12,482', diff: '+124 (24h)', icon: 'i-material-symbols-group', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { label: '活跃会话 (Sessions)', value: '1,208', diff: '峰值 1,400', icon: 'i-material-symbols-bolt', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: '存储已用 (Storage)', value: '42.5 TB', diff: '剩余 7.5 TB', icon: 'i-material-symbols-hard-drive', color: 'text-primary-500', bg: 'bg-primary-500/10' },
  { label: '运行时间 (Uptime)', value: '142 天', diff: 'System Healthy', icon: 'i-material-symbols-ecg-heart', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
]

const adminLogs = [
  { time: '10 mins ago', action: '新实例加入联邦网 (New Instance Joined): mastodon.social', type: 'info' },
  { time: '1 hour ago', action: '封禁恶意账户 (Banned Malicious Account): @spambot_001', type: 'warn' },
  { time: '3 hours ago', action: '核心系统升级 (Core System Update) v2.4.0 完成', type: 'success' },
  { time: 'Yesterday', action: '数据库自动备份完成 (DB Backup Completed)', type: 'info' }
]
</script>

<template>
  <div class="max-w-[1400px] mx-auto w-full flex flex-col gap-6 animate-[fade-in_0.4s_ease-out] pb-10 px-2 lg:px-4">
    <!-- Dashboard Header -->
    <div class="flex items-center justify-between mt-2 mb-2">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <UIcon
            name="i-material-symbols-dashboard"
            class="w-7 h-7 text-cyan-500"
          />
        </div>
        <div class="flex flex-col">
          <h1 class="text-2xl font-black text-gray-900 dark:text-white tracking-wide">
            系统概览 (Sys Overview)
          </h1>
          <p class="text-[11px] font-bold text-gray-500 dark:text-gray-400">
            Asagity Backend Matrix • All Systems Go
          </p>
        </div>
      </div>
      <!-- Quick Actions -->
      <div class="flex gap-2">
        <UButton
          icon="i-material-symbols-download"
          label="导出日志"
          color="neutral"
          variant="soft"
          class="rounded-full font-bold hidden md:flex"
        />
        <UButton
          icon="i-material-symbols-refresh"
          color="primary"
          variant="solid"
          class="rounded-full shadow-md shadow-cyan-500/20"
        />
      </div>
    </div>

    <!-- Stratum I: Core Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="m in metrics"
        :key="m.label"
        class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-md transition-shadow group cursor-default"
      >
        <div class="flex justify-between items-start mb-4">
          <div :class="`w-10 h-10 rounded-2xl flex items-center justify-center ${m.bg}`">
            <UIcon
              :name="m.icon"
              :class="`w-6 h-6 ${m.color}`"
            />
          </div>
          <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-900/50 px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-800">
            {{ m.diff }}
          </span>
        </div>
        <div class="flex flex-col">
          <span class="text-3xl font-black text-gray-900 dark:text-white mb-1 group-hover:scale-105 origin-left transition-transform duration-300">
            {{ m.value }}
          </span>
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ m.label }}</span>
        </div>
      </div>
    </div>

    <!-- Stratum II: The Data Nexus (ECharts) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Area Chart: traffic activity -->
      <div class="lg:col-span-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <div class="flex flex-col">
            <h3 class="font-black text-lg text-gray-900 dark:text-white">
              网络流量与调度 (Network & Sync)
            </h3>
            <span class="text-xs font-bold text-gray-500">7-Day Aggregation</span>
          </div>
          <USelectMenu
            :options="['Last 7 Days', 'Last 30 Days', 'This Year']"
            model-value="Last 7 Days"
            class="w-32"
          />
        </div>
        <div class="flex-1 w-full min-h-[300px]">
          <ClientOnly fallback="Loading chart matrix...">
            <VChart
              :option="trafficOptions"
              autoresize
              class="w-full h-full"
            />
          </ClientOnly>
        </div>
      </div>

      <!-- Secondary Chart: Doughnut distribution -->
      <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 p-6 shadow-sm flex flex-col relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
        <h3 class="font-black text-lg text-gray-900 dark:text-white mb-1">
          存储分布 (Storage Share)
        </h3>
        <span class="text-xs font-bold text-gray-500 mb-6">Volume Analysis</span>
        <div class="flex-1 w-full min-h-[250px]">
          <ClientOnly>
            <VChart
              :option="storageOptions"
              autoresize
              class="w-full h-full"
            />
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Stratum III: System Pulse & Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Activity Log -->
      <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6 flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon
              name="i-material-symbols-list-alt"
              class="w-5 h-5 text-indigo-500"
            />
            系统日志 (Activity Log)
          </h3>
          <span class="text-xs font-bold text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline">View All</span>
        </div>

        <div class="flex flex-col gap-4 relative">
          <!-- Timeline track -->
          <div class="absolute left-4 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />

          <div
            v-for="(log, i) in adminLogs"
            :key="i"
            class="flex gap-4 relative z-10 w-full"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[3px] border-white dark:border-gray-900"
              :class="log.type === 'info' ? 'bg-cyan-100 text-cyan-500' : log.type === 'warn' ? 'bg-amber-100 text-amber-500' : 'bg-green-100 text-green-500'"
            >
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="log.type === 'info' ? 'bg-cyan-500' : log.type === 'warn' ? 'bg-amber-500' : 'bg-green-500'"
              />
            </div>
            <div class="flex flex-col bg-white/50 dark:bg-gray-800/30 rounded-2xl px-4 py-2 flex-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
              <span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ log.action }}</span>
              <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">{{ log.time }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pulse Monitor -->
      <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-700/50 shadow-sm p-6 flex flex-col">
        <h3 class="font-black text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <UIcon
            name="i-material-symbols-memory"
            class="w-5 h-5 text-fuchsia-500"
          />
          硬件脉搏 (Hardware Pulse)
        </h3>

        <div class="flex flex-col gap-6 flex-1 justify-center">
          <!-- CPU Bar -->
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-end">
              <span class="text-sm font-bold text-gray-700 dark:text-gray-300">CPU Load (16 Cores)</span>
              <span class="text-xs font-black text-cyan-600 dark:text-cyan-400">12%</span>
            </div>
            <div class="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div class="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full w-[12%] animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>

          <!-- RAM Bar -->
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-end">
              <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Memory Used (32GB)</span>
              <span class="text-xs font-black text-fuchsia-500 dark:text-fuchsia-400">45%</span>
            </div>
            <div class="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div class="h-full bg-gradient-to-r from-fuchsia-400 to-fuchsia-500 rounded-full w-[45%]" />
            </div>
          </div>

          <!-- IO Bar -->
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-end">
              <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Disk I/O (NVMe)</span>
              <span class="text-xs font-black text-emerald-500 dark:text-emerald-400">3 MB/s</span>
            </div>
            <div class="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-[8%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
