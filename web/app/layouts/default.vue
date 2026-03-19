<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useInstanceStore } from '~/stores/instance'
import { useSplitViewStore } from '~/stores/splitView'
import { useMusicStore } from '~/stores/music'

const navigation = [
  [
    { label: '时间线', icon: 'i-lucide-home', to: '/' },
    { label: '话题', icon: 'i-lucide-hash', to: '/topic' },
    { label: '云盘', icon: 'i-lucide-cloud', to: '/drive' }
  ],
  [
    { label: '聊天', icon: 'i-lucide-message-square', to: '/chat' },
    { label: '公告', icon: 'i-lucide-megaphone', to: '/announcement' },
    { label: '社团', icon: 'i-lucide-users', to: '/orgs' }
  ],
  [
    { label: '设置', icon: 'i-lucide-settings', to: '/settings' },
    { label: '更多', icon: 'i-lucide-more-horizontal', to: '/more' },
    { label: '控制台', icon: 'i-lucide-terminal', to: '/panel' }
  ]
]

const tabs = [
  [
    { label: '动态', icon: 'i-ic-sharp-public', to: '/', exact: true },
    { label: '已关注', icon: 'i-ic-baseline-person-outline', to: '/followed' },
    { label: '仅本实例', icon: 'i-lucide-server', to: '/local' }
  ]
]

const profileTabs = [
  [
    { label: '首页', icon: 'i-lucide-house', slot: 'home' },
    { label: '动态', icon: 'i-lucide-scroll-text', slot: 'posts' },
    { label: '文件', icon: 'i-lucide-folder', slot: 'files' },
    { label: 'Raw 数据', icon: 'i-lucide-code', slot: 'raw' }
  ]
]

const instanceStore = useInstanceStore()
const splitViewStore = useSplitViewStore()
const musicStore = useMusicStore()
const containerRef = ref<HTMLElement | null>(null)

function startResizing() {
  splitViewStore.isResizing = true
}

useEventListener('mousemove', (e: MouseEvent) => {
  if (!splitViewStore.isResizing || !containerRef.value) return

  const containerRect = containerRef.value.getBoundingClientRect()
  const relativeX = e.clientX - containerRect.left
  const percentage = (relativeX / containerRect.width) * 100

  // Right panel width is the remaining percentage (minus a bit for the divider/gap if needed)
  splitViewStore.setRightPanelWidth(100 - percentage)
})

useEventListener('mouseup', () => {
  splitViewStore.isResizing = false
})
</script>

<template>
  <div class="h-screen w-screen flex bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans">
    <!-- 左侧：主导航栏 (与上方布局合并) -->
    <aside class="w-64 h-full flex flex-col shrink-0 z-20">
      <!-- 顶部 Logo -->
      <div class="h-16 flex items-center justify-between px-6 shrink-0">
        <span class="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-wider drop-shadow-sm">
          {{ instanceStore.name }}
        </span>
      </div>

      <!-- 中间 导航 -->
      <div class="flex-1 px-4 py-4 overflow-y-auto">
        <UNavigationMenu
          :items="navigation"
          orientation="vertical"
          class="w-full"
        />
      </div>

      <!-- 底部 发布按钮 -->
      <div class="p-4 shrink-0">
        <UButton
          label="发布 (Publish)"
          color="primary"
          size="xl"
          class="w-full justify-center rounded-full shadow-[0_0_15px_rgba(57,197,187,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(57,197,187,0.8)] font-bold text-base bg-gradient-to-r from-cyan-500 to-primary-600"
        />
      </div>
    </aside>

    <!-- 右侧：核心区域 -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- 顶部：功能顶栏 (与左侧布局合并) -->
      <header class="h-16 flex justify-between items-center px-6 shrink-0 z-10 transition-colors">
        <!-- 左/中：子导航栏 (context-aware) -->
        <div class="flex items-center">
          <!-- Timeline tabs (left view active or split closed) -->
          <UNavigationMenu
            v-if="!splitViewStore.isOpen || splitViewStore.activeView === 'left'"
            :items="tabs"
            class="w-full"
          />
          <!-- Profile tabs (right view active, showing user) -->
          <div
            v-else-if="splitViewStore.activeView === 'right' && splitViewStore.currentRightViewType === 'user'"
            class="flex items-center"
          >
            <div class="flex">
              <button
                v-for="tab in profileTabs[0]"
                :key="tab.slot"
                :class="[
                  splitViewStore.profileTab === tab.slot
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold border-b-2'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 border-b-2',
                  'flex items-center gap-1.5 whitespace-nowrap py-1.5 px-3 text-sm transition-all duration-200'
                ]"
                @click="splitViewStore.setProfileTab(tab.slot)"
              >
                <UIcon
                  :name="tab.icon"
                  class="w-4 h-4"
                />
                {{ tab.label }}
              </button>
            </div>
          </div>
          <!-- Post detail tabs (right view active, showing post) -->
          <UNavigationMenu
            v-else
            :items="tabs"
            class="w-full"
          />
        </div>

        <!-- 右侧：小组件 -->
        <div class="flex items-center gap-4">
          <!-- 音乐播放器组件 (联动 musicStore) -->
          <div
            class="flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full pr-2 pl-1 py-1 border border-white/20 dark:border-gray-700/50 shadow-sm transition-all hover:scale-105 cursor-pointer group"
            @click="splitViewStore.openMusic()"
          >
            <img
              :src="musicStore.currentTrack.albumArt"
              class="w-6 h-6 rounded-full object-cover shrink-0 shadow-sm transition-transform duration-700"
              :class="musicStore.isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''"
              alt="Art"
            >
            <div class="w-24 overflow-hidden mask-image:linear-gradient(to_right,white_80%,transparent)">
              <div
                class="text-xs font-bold whitespace-nowrap inline-block text-gray-800 dark:text-gray-100"
                :class="musicStore.isPlaying ? 'animate-[marquee_10s_linear_infinite]' : ''"
              >
                {{ musicStore.currentTrack.title }}
              </div>
            </div>
            <UButton
              :icon="musicStore.isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
              color="neutral"
              variant="ghost"
              size="xs"
              class="rounded-full hover:bg-cyan-500/20"
              @click.stop="musicStore.togglePlay()"
            />
          </div>

          <!-- 通知按钮 -->
          <div class="relative flex items-center justify-center">
            <UButton
              icon="i-lucide-bell"
              color="neutral"
              variant="ghost"
              @click="splitViewStore.openNotifications()"
            />
            <span class="absolute top-1 right-1 flex w-2 h-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span class="relative inline-flex rounded-full w-2 h-2 bg-red-500" />
            </span>
          </div>

          <!-- 用户头像 -->
          <UAvatar
            src="https://avatars.githubusercontent.com/u/739984?v=4"
            alt="Avatar"
            size="sm"
            class="ring-2 ring-cyan-500/50 cursor-pointer hover:ring-cyan-500 transition-all"
          />
        </div>
      </header>

      <!-- 下半部分：双栏显示区域 (True Split View 架构) -->
      <div class="flex-1 overflow-hidden p-4 pt-0">
        <div
          ref="containerRef"
          class="relative h-full w-full flex gap-1.5 overflow-hidden"
        >
          <!-- 左侧：主视图容器 -->
          <div
            class="h-full bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden cursor-default"
            :class="[
              splitViewStore.isResizing ? '' : 'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
              splitViewStore.isOpen && splitViewStore.activeView === 'left'
                ? 'border-cyan-400/60 shadow-[0_0_0_2px_rgba(34,211,238,0.15),0_4px_20px_rgba(0,0,0,0.03)]'
                : 'border-gray-200/50 dark:border-gray-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            ]"
            :style="{
              width: splitViewStore.isOpen ? `${100 - splitViewStore.rightPanelWidth}%` : '100%',
              transform: splitViewStore.isOpen ? 'translateX(-8px)' : 'translateX(0)'
            }"
            @pointerdown="splitViewStore.focusLeft()"
          >
            <div class="h-full overflow-y-auto p-6 lg:p-10 custom-scrollbar">
              <slot />
            </div>
          </div>

          <!-- 可调节缝隙 (Divider) -->
          <div
            v-if="splitViewStore.isOpen"
            class="w-1.5 h-full cursor-col-resize hover:bg-cyan-500/20 active:bg-cyan-500/40 transition-colors z-30 shrink-0 rounded-full"
            @mousedown="startResizing"
          />

          <!-- 右侧：详情面板容器 -->
          <div
            class="h-full overflow-hidden"
            :class="[
              splitViewStore.isResizing ? '' : 'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
              splitViewStore.isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            ]"
            :style="{ width: splitViewStore.isOpen ? `${splitViewStore.rightPanelWidth}%` : '0px' }"
            @pointerdown="splitViewStore.focusRight()"
          >
            <div
              class="h-full bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden"
              :class="[
                splitViewStore.activeView === 'right'
                  ? 'border-cyan-400/60 shadow-[0_0_0_2px_rgba(34,211,238,0.15),0_4px_20px_rgba(0,0,0,0.03)]'
                  : 'border-gray-200/50 dark:border-gray-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
              ]"
            >
              <!-- Route to correct component based on content type -->
              <AppUserProfile v-if="splitViewStore.currentRightViewType === 'user' && splitViewStore.isOpen" />
              <AppPostDetail v-else-if="splitViewStore.currentRightViewType === 'post' && splitViewStore.isOpen" />
              <AppMusicPlayer v-else-if="splitViewStore.currentRightViewType === 'music' && splitViewStore.isOpen" />
              <AppNotifications v-else-if="splitViewStore.currentRightViewType === 'notifications' && splitViewStore.isOpen" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
@keyframes marquee {
  0% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(-100%);
  }
}
</style>
