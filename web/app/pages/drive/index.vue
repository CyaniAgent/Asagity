<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'

// 用户名模拟 (用于以后扩展)
const username = ref('YunaAyase')

// 容量计算：总容量 16384 MB (16 GB)，已用 3549 MB
const totalCapacityMB = 16384
const usedCapacityMB = 3549

// 增强型智能换算函数 (支持 B 到 TB)
function formatBytes(value: number, inputUnit: 'B' | 'KB' | 'MB' | 'GB' | 'TB' = 'MB') {
  if (value === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitFactor: Record<typeof inputUnit, number> = {
    'B': 1, 'KB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4
  }

  const bytes = value * unitFactor[inputUnit]

  let i = Math.floor(Math.log(bytes) / Math.log(1024))
  i = Math.max(0, Math.min(i, units.length - 1))

  const unit = units[i] || 'B'
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + unit
}

const formattedUsed = computed(() => formatBytes(usedCapacityMB, 'MB'))
const formattedTotal = computed(() => formatBytes(totalCapacityMB, 'MB'))
const progressPercentage = computed(() => (usedCapacityMB / totalCapacityMB) * 100)

const isGridView = ref(false)

// 初始数据
const folders = [
  { id: 'f1', type: 'folder', name: 'Images', modifiedAt: new Date(2026, 2, 20), sizeMB: 1250 },
  { id: 'f2', type: 'folder', name: 'Projects', modifiedAt: new Date(2026, 2, 22), sizeMB: 540 },
  { id: 'f3', type: 'folder', name: 'Music', modifiedAt: new Date(2026, 2, 23), sizeMB: 800 }
]

const files = [
  { id: 'fi1', type: 'file', name: 'design-tokens.md', modifiedAt: new Date(2026, 2, 24), sizeMB: 0.02 },
  { id: 'fi2', type: 'file', name: 'Project_Alpha_v2.zip', modifiedAt: new Date(2026, 2, 18), sizeMB: 45.5 },
  { id: 'fi3', type: 'file', name: 'screen_recording.webp', modifiedAt: new Date(2026, 2, 19), sizeMB: 12.3 }
]

// 统一项列表：合并文件夹与文件，并排序 (文件夹置顶，然后按名称排序)
const unifiedItems = computed(() => {
  const combined = [...folders, ...files]
  return combined.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name)
    }
    return a.type === 'folder' ? -1 : 1
  })
})
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-[fade-in_0.4s_ease-out]">
    <!-- Header Controls (Refined: No Logo/Title) -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-6 rounded-[30px] border border-gray-200/50 dark:border-gray-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] shrink-0">

      <!-- Left: Capacity Progress (Occupies title space) -->
      <div class="flex flex-col gap-2 w-full md:w-80 shrink-0">
        <div
          class="flex justify-between items-center text-[10px] font-black tracking-[0.1em] text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1.5">
            <UIcon name="i-material-symbols-cloud" class="w-3 h-3" /> {{ formattedUsed }} used
          </span>
          <span>{{ formattedTotal }} total</span>
        </div>
        <div class="h-2.5 w-full bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
          <div
            class="h-full bg-gradient-to-r from-cyan-400 to-primary-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(57,197,187,0.5)]"
            :style="{ width: `${progressPercentage}%` }" />
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
        <UButton icon="i-material-symbols-refresh" color="neutral" variant="ghost"
          class="rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-cyan-500 transition-colors" />
        <UButton icon="i-material-symbols-create-new-folder" color="neutral" variant="ghost"
          class="rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-cyan-500 transition-colors" />
        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
        <UButton :icon="isGridView ? 'i-material-symbols-view-list' : 'i-material-symbols-grid-view'" color="neutral"
          variant="ghost" class="rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          :class="isGridView ? 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-cyan-500' : 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20'"
          @click="isGridView = !isGridView" />
        <UButton icon="i-material-symbols-upload" label="上传文件" color="primary" size="lg"
          class="rounded-full shadow-[0_0_15px_rgba(57,197,187,0.4)] hover:shadow-[0_0_25px_rgba(57,197,187,0.7)] hover:scale-105 transition-all px-6 font-bold ml-2" />
      </div>
    </div>

    <!-- Unified Content Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-10 pr-2">

      <!-- List View (Unified) -->
      <div v-if="!isGridView"
        class="flex flex-col bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-[30px] border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
        <div
          class="grid grid-cols-12 gap-4 px-6 md:px-8 py-4 border-b border-gray-100/80 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest sticky top-0 z-10">
          <div class="col-span-12 md:col-span-6 flex items-center">
            名称
            <UIcon name="i-material-symbols-arrow-drop-down" class="ml-1 w-4 h-4" />
          </div>
          <div class="col-span-3 hidden md:block">修改日期</div>
          <div class="col-span-2 hidden md:block text-right pr-4">大小</div>
          <div class="col-span-1 hidden md:block"></div>
        </div>

        <div class="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/30">
          <div v-for="item in unifiedItems" :key="item.id"
            class="grid grid-cols-12 gap-4 px-6 md:px-8 py-3.5 items-center hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer group">
            <div class="col-span-12 md:col-span-6 flex items-center gap-4 overflow-hidden">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                :class="item.type === 'folder' ? 'bg-cyan-50 dark:bg-cyan-500/10' : 'bg-gray-100 dark:bg-gray-700/50 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10'">
                <UIcon :name="item.type === 'folder' ? 'i-material-symbols-folder' : 'i-material-symbols-draft-rounded'"
                  class="w-5.5 h-5.5 transition-colors"
                  :class="item.type === 'folder' ? 'text-cyan-500 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-cyan-500'" />
              </div>
              <span
                class="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{{
                  item.name }}</span>
            </div>

            <div class="col-span-3 hidden md:block text-[13px] font-semibold text-gray-500 dark:text-gray-400">
              {{ format(item.modifiedAt, 'yyyy-MM-dd HH:mm') }}
            </div>

            <div
              class="col-span-2 hidden md:block text-right pr-4 text-[13px] font-black text-gray-500 dark:text-gray-400 font-mono">
              {{ formatBytes(item.sizeMB, 'MB') }}
            </div>

            <div
              class="col-span-1 hidden md:block flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <UButton icon="i-material-symbols-more-vert" color="neutral" variant="ghost"
                class="rounded-full w-8 h-8 flex items-center justify-center" @click.stop="" />
            </div>
          </div>
        </div>
      </div>

      <!-- Grid View (Unified) -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 px-1">
        <div v-for="item in unifiedItems" :key="item.id"
          class="flex flex-col bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-[24px] border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer group overflow-hidden">

          <div
            class="h-28 flex items-center justify-center border-b border-gray-100/80 dark:border-gray-700/50 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10 transition-colors"
            :class="item.type === 'folder' ? 'bg-cyan-50/30 dark:bg-gray-900/40' : 'bg-gray-50 dark:bg-gray-900/40'">
            <UIcon :name="item.type === 'folder' ? 'i-material-symbols-folder' : 'i-material-symbols-draft-rounded'"
              class="w-12 h-12 transition-all group-hover:scale-110 duration-500"
              :class="item.type === 'folder' ? 'text-cyan-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-cyan-500'" />
          </div>

          <div class="p-4 flex flex-col gap-1">
            <span
              class="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {{ item.name }}
            </span>
            <div
              class="flex items-center justify-between mt-1 text-[10px] font-black tracking-wider text-gray-400 dark:text-gray-500 uppercase">
              <span>{{ format(item.modifiedAt, 'MM-dd') }}</span>
              <span>{{ formatBytes(item.sizeMB, 'MB') }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
</style>
