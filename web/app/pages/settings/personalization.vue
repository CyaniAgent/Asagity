<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'

useHead({
  title: '个性化 | 设置'
})

const themeStore = useThemeStore()

const colorModeOptions = [
  {
    value: 'system' as const,
    label: '跟随系统',
    description: '自动适配设备深浅色模式',
    icon: 'i-material-symbols-settings-brightness'
  },
  {
    value: 'light' as const,
    label: '浅色模式',
    description: '始终使用浅色主题',
    icon: 'i-material-symbols-light-mode'
  },
  {
    value: 'dark' as const,
    label: '深色模式',
    description: '始终使用深色主题',
    icon: 'i-material-symbols-dark-mode'
  }
]

const wallpapers = [
  { id: 'default', name: '默认', thumbnail: '/images/wallpapers/default.webp' },
  { id: 'gradients', name: '渐变', thumbnail: '/images/wallpapers/gradients.webp' },
  { id: 'miku', name: '初音未来', thumbnail: '/images/wallpapers/miku.webp' }
]

const selectedWallpaper = ref('default')
const wallpaperIntensity = ref(50)

function handleColorModeChange(mode: 'light' | 'dark' | 'system') {
  themeStore.setPreference(mode)
}
</script>

<template>
  <div class="max-w-[800px] mx-auto space-y-8 pb-12 animate-[fade-in_0.3s_ease-out]">
    <!-- Header -->
    <section class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-primary-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
        <UIcon
          name="i-material-symbols-palette"
          class="w-6 h-6 text-white"
        />
      </div>
      <div>
        <h1 class="text-2xl font-black text-gray-900 dark:text-white">
          个性化
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          自定义您的 Asagity 外观
        </p>
      </div>
    </section>

    <!-- Color Mode Selection -->
    <section class="bg-white dark:bg-gray-900 rounded-[30px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 class="text-[18px] font-black text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon
            name="i-material-symbols-palette"
            class="w-5 h-5 text-cyan-500"
          />
          主题
        </h2>
      </div>

      <div class="p-4 space-y-3">
        <button
          v-for="option in colorModeOptions"
          :key="option.value"
          class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left group"
          :class="themeStore.preference === option.value
            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 shadow-[0_0_15px_rgba(57,197,187,0.15)]'
            : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'"
          @click="handleColorModeChange(option.value)"
        >
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all"
            :class="themeStore.preference === option.value
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'"
          >
            <UIcon
              :name="option.icon"
              class="w-6 h-6"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[15px] font-bold text-gray-900 dark:text-white">
              {{ option.label }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ option.description }}
            </div>
          </div>
          <div
            class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
            :class="themeStore.preference === option.value
              ? 'border-cyan-500 bg-cyan-500'
              : 'border-gray-300 dark:border-gray-600'"
          >
            <UIcon
              v-if="themeStore.preference === option.value"
              name="i-material-symbols-check"
              class="w-4 h-4 text-white"
            />
          </div>
        </button>
      </div>

      <!-- Preview Card -->
      <div class="px-6 pb-6">
        <div
          class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-all duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/50' : 'bg-gray-50'"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              :class="themeStore.isDark ? 'bg-gray-700' : 'bg-white'"
            >
              <UIcon
                name="i-material-symbols-bolt"
                class="w-5 h-5 text-cyan-500"
              />
            </div>
            <div>
              <div
                class="text-sm font-bold transition-colors"
                :class="themeStore.isDark ? 'text-white' : 'text-gray-900'"
              >
                Asagity
              </div>
              <div
                class="text-xs transition-colors"
                :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
              >
                {{ themeStore.modeLabel }} · 预览效果
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Wallpaper Settings -->
    <section class="bg-white dark:bg-gray-900 rounded-[30px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 class="text-[18px] font-black text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon
            name="i-material-symbols-image"
            class="w-5 h-5 text-cyan-500"
          />
          壁纸
        </h2>
      </div>

      <div class="p-6 space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <button
            v-for="wallpaper in wallpapers"
            :key="wallpaper.id"
            class="aspect-video rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            :class="selectedWallpaper === wallpaper.id
              ? 'border-cyan-500 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
            @click="selectedWallpaper = wallpaper.id"
          >
            <div
              class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
            >
              <UIcon
                name="i-material-symbols-image"
                class="w-6 h-6 text-gray-400 dark:text-gray-500"
              />
            </div>
          </button>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">壁纸强度</label>
            <span class="text-xs font-bold text-cyan-500">{{ wallpaperIntensity }}%</span>
          </div>
          <URange
            v-model="wallpaperIntensity"
            :min="0"
            :max="100"
            :step="10"
            class="w-full"
          />
        </div>
      </div>
    </section>

    <!-- Animation Settings -->
    <section class="bg-white dark:bg-gray-900 rounded-[30px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 class="text-[18px] font-black text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon
            name="i-material-symbols-animation"
            class="w-5 h-5 text-cyan-500"
          />
          动效
        </h2>
      </div>

      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              页面过渡动画
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              页面切换时的动画效果
            </div>
          </div>
          <UToggle color="primary" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              音乐可视化
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              音乐播放时的动态可视化效果
            </div>
          </div>
          <UToggle
            color="primary"
            :model-value="true"
          />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              通知动画
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              新通知进入时的弹跳效果
            </div>
          </div>
          <UToggle
            color="primary"
            :model-value="true"
          />
        </div>
      </div>
    </section>
  </div>
</template>
