<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useInstanceStore } from '~/stores/instance'
import { useSystemStore } from '~/stores/system'
import { useThemeStore } from '~/stores/theme'
import { useIconCache } from '~/composables/useIconCache'
import { useElementBounding } from '@vueuse/core'

const route = useRoute()
const systemStore = useSystemStore()
const isWidgetsOpen = ref(false)
const isWidgetsToggling = ref(false)

const toggleWidgets = () => {
  isWidgetsToggling.value = true
  isWidgetsOpen.value = !isWidgetsOpen.value
  // 等待动画结束后重置状态
  setTimeout(() => {
    isWidgetsToggling.value = false
  }, 600)
}

const navigation = [
  [
    { label: '时间线', icon: 'i-material-symbols-home', to: '/', activePaths: ['/', '/followed', '/local'] },
    { label: '话题', icon: 'i-material-symbols-tag', to: '/topic' },
    { label: 'Skyline 云盘', icon: 'i-material-symbols-cloud', to: '/drive' }
  ],
  [
    { label: '聊天', icon: 'i-material-symbols-chat', to: '/chat' },
    { label: '公告', icon: 'i-material-symbols-campaign', to: '/announcement' },
    { label: '社团', icon: 'i-material-symbols-group', to: '/orgs' }
  ],
  [
    { label: '设置', icon: 'i-material-symbols-settings', to: '/settings' },
    { label: '更多', icon: 'i-material-symbols-more-horiz', to: '/more' },
    { label: '控制台', icon: 'i-material-symbols-terminal', to: '/panel' }
  ]
]

const isItemActive = (item: { label: string, activePaths?: string[], to?: string }) => {
  if (item.label === '更多') {
    return moreMenuGroups.flat().some(feat => route.path.startsWith(feat.to))
  }
  if (item.to) {
    return route.path.startsWith(item.to)
  }
  return false
}

// Timeline Top Tabs
const timelineTabs = computed(() => [
  [
    {
      label: '动态',
      icon: 'i-material-symbols-public',
      to: '/',
      active: route.path === '/' && !route.query.tab
    },
    {
      label: '已关注',
      icon: 'i-material-symbols-person',
      to: '/?tab=followed',
      active: route.path === '/' && route.query.tab === 'followed'
    },
    {
      label: '仅本实例',
      icon: 'i-material-symbols-dns',
      to: '/?tab=local',
      active: route.path === '/' && route.query.tab === 'local'
    }
  ]
])

// Chat Top Tabs
const chatTabs = [
  [
    { label: '消息', icon: 'i-material-symbols-chat', to: '/chat', exact: true },
    { label: '通讯录', icon: 'i-material-symbols-contacts', to: '/chat/contacts' },
    { label: 'Asagity Meet', icon: 'i-material-symbols-video-camera-front', to: '/chat/meet' }
  ]
]

// Settings Top Tabs
const settingsTabs = [
  [
    { label: '本用户', icon: 'i-material-symbols-person', to: '/settings/profile' },
    { label: 'Skyline 云盘', icon: 'i-material-symbols-cloud', to: '/settings/drive' },
    { label: '安全与隐私', icon: 'i-material-symbols-gpp-maybe', to: '/settings/security' },
    { label: '通知', icon: 'i-material-symbols-notifications', to: '/settings/notifications' },
    { label: '个性化', icon: 'i-material-symbols-palette', to: '/settings/personalization' },
    { label: '声音', icon: 'i-material-symbols-volume-up', to: '/settings/sound' },
    { label: '插件', icon: 'i-material-symbols-extension', to: '/settings/plugins' },
    { label: '三方连接', icon: 'i-material-symbols-link', to: '/settings/connections' },
    { label: '其他', icon: 'i-material-symbols-more-horiz', to: '/settings/other' }
  ]
]

// Drive Top Tabs
const driveTabs = [
  [
    { label: '文件', icon: 'i-material-symbols-folder', to: '/drive', exact: true },
    { label: '共享', icon: 'i-material-symbols-folder-shared', to: '/drive/shared' },
    { label: 'Drop', icon: 'i-material-symbols-sync', to: '/drive/drop' }
  ]
]

// Console Top Tabs
const panelTabs = [
  [
    { label: '概览', icon: 'i-material-symbols-dashboard', to: '/panel', exact: true },
    { label: '实例设置', icon: 'i-material-symbols-settings-applications', to: '/panel/settings' },
    { label: '管理', icon: 'i-material-symbols-manage-accounts', to: '/panel/manage' },
    { label: 'Asagity NET', icon: 'i-material-symbols-hub', to: '/panel/net' },
    { label: '关于', icon: 'i-material-symbols-info', to: '/panel/about' }
  ]
]

// Topic Top Tabs
const topicTabs = [
  [
    { label: '话题', icon: 'i-material-symbols-tag', to: '/topic', exact: true },
    { label: '创建话题', icon: 'i-material-symbols-add-circle', to: '/topic/create' }
  ]
]

// Determine which tabs to show based on the active route
const currentHeaderTabs = computed(() => {
  if (route.path.startsWith('/chat')) {
    return chatTabs
  }
  if (route.path.startsWith('/settings')) {
    return settingsTabs
  }
  if (route.path.startsWith('/drive')) {
    return driveTabs
  }
  if (route.path.startsWith('/panel')) {
    return panelTabs
  }
  if (route.path.startsWith('/topic')) {
    return topicTabs
  }
  return timelineTabs.value
})

const profileTabs = [
  [
    { label: '首页', icon: 'i-material-symbols-home', slot: 'home' },
    { label: '动态', icon: 'i-material-symbols-article', slot: 'posts' },
    { label: '文件', icon: 'i-material-symbols-folder', slot: 'files' },
    { label: 'Raw 数据', icon: 'i-material-symbols-code', slot: 'raw' }
  ]
]

const instanceStore = useInstanceStore()
const splitViewStore = useSplitViewStore()
const musicStore = useMusicStore()
const themeStore = useThemeStore()
const { getIconUrl } = useIconCache()
const containerRef = ref<HTMLElement | null>(null)

function startResizing() {
  splitViewStore.isResizing = true
}

function handleMouseMove(e: MouseEvent) {
  if (!splitViewStore.isResizing || !containerRef.value) return

  const containerRect = containerRef.value.getBoundingClientRect()
  const relativeX = e.clientX - containerRect.left
  const percentage = (relativeX / containerRect.width) * 100

  splitViewStore.setRightPanelWidth(100 - percentage)
}

function handleMouseUp() {
  splitViewStore.isResizing = false
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

const splitViewTitle = computed(() => {
  const type = splitViewStore.currentRightViewType
  switch (type) {
    case 'post': return '帖子详情'
    case 'user': return splitViewStore.currentUser?.displayName || '用户主页'
    case 'music': return '音乐播放器'
    case 'notifications': return '通知中心'
    case 'chat': return splitViewStore.currentChat?.name || 'Asagity Chat'
    default: return 'Split View'
  }
})

const splitViewIcon = computed(() => {
  const type = splitViewStore.currentRightViewType
  switch (type) {
    case 'post': return 'i-material-symbols-article'
    case 'user': return 'i-material-symbols-person'
    case 'music': return 'i-material-symbols-music-note'
    case 'notifications': return 'i-material-symbols-notifications'
    case 'chat': return 'i-material-symbols-forum'
    default: return 'i-material-symbols-dock-to-left'
  }
})

const moreMenuOpen = ref(false)
const moreMenuRef = ref<HTMLElement | null>(null)
const moreMenuPanelRef = ref<HTMLElement | null>(null)

// Extract the single element from the ref array
const moreMenuAnchor = computed(() => {
  const el = moreMenuRef.value
  return Array.isArray(el) ? el[0] : el
})

const { top, right } = useElementBounding(moreMenuAnchor)

const menuActualHeight = ref(0)

const moreMenuPosition = computed(() => {
  const menuWidth = 208
  const padding = 12
  const topMargin = 8
  const bottomMargin = 25

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const actualHeight = menuActualHeight.value || 300

  const wouldOverflowRight = right.value + padding + menuWidth > viewportWidth
  const wouldOverflowBottom = top.value + actualHeight + bottomMargin > viewportHeight

  let finalTop = top.value
  if (wouldOverflowBottom) {
    finalTop = Math.max(topMargin, viewportHeight - actualHeight - bottomMargin)
  }

  return {
    top: finalTop,
    left: wouldOverflowRight ? Math.max(topMargin, right.value - menuWidth - padding) : right.value + padding
  }
})

let resizeObserver: ResizeObserver | null = null

const updateMenuHeight = () => {
  if (moreMenuPanelRef.value) {
    const rect = moreMenuPanelRef.value.getBoundingClientRect()
    menuActualHeight.value = rect.height
  }
}

watch(moreMenuOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      updateMenuHeight()

      if (moreMenuPanelRef.value && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          updateMenuHeight()
        })
        resizeObserver.observe(moreMenuPanelRef.value)
      }
    })
  } else {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

const toggleMoreMenu = () => {
  moreMenuOpen.value = !moreMenuOpen.value
}

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// "More" Menu feature groups (Misskey-inspired)
const moreMenuGroups = [
  [
    { label: '收藏', icon: 'i-material-symbols-star-outline', to: '/bookmarks' },
    { label: 'Mini App', icon: 'i-material-symbols-widgets-outline', to: '/miniapp' },
    { label: '多维码', icon: 'i-material-symbols-qr-code', to: '/qrcode' },
    { label: '小游戏', icon: 'i-material-symbols-sports-esports-outline', to: '/games' }
  ],
  [
    { label: '图集', icon: 'i-material-symbols-photo-library', to: '/albums' },
    { label: '成就', icon: 'i-material-symbols-military-tech-outline', to: '/achievements' }
  ],
  [
    { label: '开发者', icon: 'i-material-symbols-terminal', to: '/developer' },
    { label: '关于', icon: 'i-material-symbols-help-outline', to: '/about' }
  ]
]
</script>

<template>
  <div class="h-screen w-screen flex bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans">
    <!-- 左侧：主导航栏 (与上方布局合并) -->
    <aside class="w-64 h-full flex flex-col shrink-0 z-20">
      <!-- 顶部 Logo -->
      <NuxtLink
        to="/about"
        class="h-24 flex items-center px-6 shrink-0 group/logo cursor-pointer relative block"
      >
        <div class="w-12 h-12 flex items-center justify-center group-hover/logo:scale-110 transition-all duration-300">
          <img
            v-if="instanceStore.logoURL"
            :src="getIconUrl(instanceStore.logoURL)"
            class="w-full h-full object-cover"
          >
          <UIcon
            v-else
            name="i-material-symbols-bolt"
            class="w-7 h-7 text-white"
          />
        </div>

        <!-- 悬停显示的实例名称 (Floating Info) -->
        <div
          class="absolute left-20 opacity-0 group-hover/logo:opacity-100 translate-x-[-10px] group-hover/logo:translate-x-0 transition-all duration-300 pointer-events-none z-50"
        >
          <div
            class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/20 dark:border-gray-800 shadow-2xl flex flex-col min-w-[140px]"
          >
            <span class="text-[10px] font-black text-cyan-500 mb-1">
              This Instance
            </span>
            <span class="text-sm font-black text-gray-900 dark:text-white leading-tight">
              {{ instanceStore.name }}
            </span>
          </div>
        </div>
      </NuxtLink>

      <!-- 中间 导航 -->
      <nav class="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar flex flex-col gap-3">
        <div
          v-for="(group, gIdx) in navigation"
          :key="gIdx"
          class="flex flex-col gap-0.5"
        >
          <template
            v-for="item in group"
            :key="item.label"
          >
            <!-- Special Case: "More" — hand-rolled popover -->
            <div
              v-if="item.label === '更多'"
              ref="moreMenuRef"
              class="w-full"
            >
              <button
                type="button"
                class="flex items-center gap-4 px-4 py-2.5 rounded-2xl w-full text-left transition-colors font-bold group/nav"
                :class="moreMenuOpen || isItemActive(item)
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'"
                @click="toggleMoreMenu"
              >
                <UIcon
                  :name="item.icon"
                  class="w-[22px] h-[22px] opacity-70 shrink-0"
                />
                <span class="text-[15px] tracking-wide">{{ item.label }}</span>
                <UIcon
                  name="i-material-symbols-chevron-right"
                  class="w-4 h-4 ml-auto opacity-40 transition-transform duration-200"
                  :class="{ 'rotate-90': moreMenuOpen }"
                />
              </button>

              <!-- Popover Panel -->
              <ClientOnly>
                <Teleport to="body">
                  <Transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="opacity-0 scale-95 translate-x-2"
                    enter-to-class="opacity-100 scale-100 translate-x-0"
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100 scale-100 translate-x-0"
                    leave-to-class="opacity-0 scale-95 translate-x-2"
                  >
                    <div
                      v-if="moreMenuOpen"
                      ref="moreMenuPanelRef"
                      class="fixed z-[100] w-52 origin-top-left"
                      :style="{ top: `${moreMenuPosition.top}px`, left: `${moreMenuPosition.left}px` }"
                    >
                      <div
                        class="rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden py-1.5"
                      >
                        <template
                          v-for="(grp, gi) in moreMenuGroups"
                          :key="gi"
                        >
                          <div class="px-1">
                            <NuxtLink
                              v-for="feat in grp"
                              :key="feat.label"
                              :to="feat.to"
                              class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                              @click="moreMenuOpen = false"
                            >
                              <UIcon
                                :name="feat.icon"
                                class="w-[18px] h-[18px] shrink-0 opacity-70"
                              />
                              {{ feat.label }}
                            </NuxtLink>
                          </div>
                          <div
                            v-if="gi < moreMenuGroups.length - 1"
                            class="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-1"
                          />
                        </template>
                      </div>
                    </div>
                  </Transition>
                </Teleport>
              </ClientOnly>
            </div>

            <!-- Standard Navigation Link -->
            <NuxtLink
              v-else
              :to="item.to"
              class="flex items-center gap-4 px-4 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-bold group/nav"
              :class="isItemActive(item)
                ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                : 'text-gray-700 dark:text-gray-300'"
            >
              <UIcon
                :name="item.icon"
                class="w-[22px] h-[22px] transition-opacity"
                :class="isItemActive(item) ? 'opacity-100' : 'opacity-70 group-hover/nav:opacity-100'"
              />
              <span class="text-[15px] tracking-wide">{{ item.label }}</span>
            </NuxtLink>
          </template>
          <div
            v-if="gIdx < navigation.length - 1"
            class="h-px bg-gray-200 dark:bg-white/10 my-2.5 mx-3"
          />
        </div>
      </nav>

      <!-- 底部：拆分视图管理 (Split View Task Manager) -->
      <div
        v-if="splitViewStore.isOpen"
        class="px-4 pb-2 shrink-0 animate-[fade-in_0.3s_ease-out]"
      >
        <div
          class="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-widest flex items-center gap-1"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          Active display
        </div>
        <div
          class="bg-gray-100 dark:bg-gray-800/80 rounded-[20px] p-3 border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group cursor-pointer backdrop-blur-md"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <div
              class="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm"
            >
              <UIcon
                :name="splitViewIcon"
                class="w-4 h-4 text-cyan-600 dark:text-cyan-400"
              />
            </div>
            <div class="flex flex-col overflow-hidden">
              <span class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ splitViewTitle }}
              </span>
              <span class="text-[10px] items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400/80">
                Split view
              </span>
            </div>
          </div>
          <UButton
            icon="i-material-symbols-close"
            color="neutral"
            variant="ghost"
            class="rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 hover:text-red-500"
            @click.stop="splitViewStore.close()"
          />
        </div>
      </div>

      <div class="p-4 shrink-0">
        <UButton
          icon="i-material-symbols-send"
          label="发布"
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
          <!-- Timeline & Settings tabs (left view active or split closed) -->
          <UNavigationMenu
            v-if="!splitViewStore.isOpen || splitViewStore.activeView === 'left'"
            :items="currentHeaderTabs"
            class="w-full flex-nowrap overflow-x-auto custom-scrollbar no-scrollbar"
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
            :items="currentHeaderTabs"
            class="w-full"
          />
        </div>

        <!-- 右侧：小组件 -->
        <div class="flex items-center gap-4">
          <!-- Dimension Signal (Core Status) - Independent -->
          <div
            class="flex items-center gap-2 px-2 h-8 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-sm transition-all hover:scale-105 cursor-help group"
            :title="systemStore.isBackendOnline ? '服务端已连接 (Asagity NET Online)' : '服务端已断开 (Asagity NET Offline)'"
          >
            <UIcon
              :name="systemStore.isBackendOnline ? 'i-material-symbols-android-wifi-3-bar-rounded' : 'i-material-symbols-android-wifi-3-bar-off-rounded'"
              class="w-4 h-4 transition-colors duration-500"
              :class="systemStore.isBackendOnline ? 'text-green-400' : 'text-red-400 animate-pulse'"
            />

            <!-- Development Mode Label -->
            <div
              v-if="systemStore.isDevMode"
              class="flex items-center gap-1.5 pr-1 animate-pulse"
            >
              <div class="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-0.5" />
              <UIcon
                name="i-material-symbols-terminal-rounded"
                class="w-3.5 h-3.5 text-cyan-500"
              />
              <span class="text-[10px] font-black text-cyan-500 tracking-wider">In Development</span>
            </div>
          </div>

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
            <div class="w-24 overflow-hidden">
              <div
                class="text-xs font-bold whitespace-nowrap inline-block text-gray-800 dark:text-gray-100"
                :class="musicStore.isPlaying ? 'animate-[marquee_10s_linear_infinite]' : ''"
              >
                {{ musicStore.currentTrack.title }}
              </div>
            </div>
            <UButton
              :icon="musicStore.isPlaying ? 'i-material-symbols-pause' : 'i-material-symbols-play-arrow'"
              color="neutral"
              variant="ghost"
              size="xs"
              class="rounded-full hover:bg-cyan-500/20"
              @click.stop="musicStore.togglePlay()"
            />
          </div>

          <!-- 主题切换按钮 -->
          <div
            class="flex items-center h-8 px-2 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-sm transition-all hover:scale-105 cursor-pointer group"
            :title="`当前: ${themeStore.modeLabel}`"
            @click="themeStore.toggle()"
          >
            <UIcon
              :name="themeStore.isDark ? 'i-material-symbols-dark-mode' : 'i-material-symbols-light-mode'"
              class="w-4 h-4 transition-colors"
              :class="themeStore.isDark ? 'text-cyan-400' : 'text-yellow-500'"
            />
          </div>

          <!-- 小组件按钮 -->
          <div
            class="relative flex items-center justify-center cursor-pointer mr-2"
            @click="toggleWidgets"
          >
            <UButton
              icon="i-material-symbols-widgets"
              :color="isWidgetsOpen ? 'primary' : 'neutral'"
              variant="ghost"
              class="cursor-pointer"
            />
          </div>

          <!-- 通知按钮 -->
          <div
            class="relative flex items-center justify-center cursor-pointer"
            @click="splitViewStore.openNotifications()"
          >
            <UButton
              icon="i-material-symbols-notifications"
              color="neutral"
              variant="ghost"
              class="cursor-pointer"
            />
            <span class="absolute top-1 right-1 flex w-2 h-2 pointer-events-none">
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
          class="relative h-full w-full flex overflow-hidden"
        >
          <!-- 左侧：主视图容器 -->
          <div
            class="h-full bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden cursor-default"
            :class="[
              splitViewStore.isResizing ? 'transition-none' : 'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
              splitViewStore.isOpen && splitViewStore.activeView === 'left'
                ? 'border-cyan-400/60 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]'
                : 'border-gray-200/50 dark:border-gray-800/50'
            ]"
            :style="{
              width: splitViewStore.isMaximized ? '0%' : (splitViewStore.isOpen ? `calc(${100 - splitViewStore.rightPanelWidth}% - ${isWidgetsOpen ? 326 : 0}px - 6px)` : `calc(100% - ${isWidgetsOpen ? 326 : 0}px)`),
              opacity: splitViewStore.isMaximized ? '0' : '1',
              pointerEvents: splitViewStore.isMaximized ? 'none' : 'auto'
            }"
            @pointerdown="splitViewStore.focusLeft()"
          >
            <div class="h-full overflow-y-auto p-6 lg:p-10 custom-scrollbar">
              <slot />
            </div>
          </div>

          <!-- 可调节缝隙 (Divider) -->
          <div
            v-if="splitViewStore.isOpen && !splitViewStore.isMaximized"
            class="w-1.5 h-full cursor-col-resize hover:bg-cyan-500/20 active:bg-cyan-500/40 transition-colors z-30 shrink-0 rounded-full mx-1.5"
            @mousedown="startResizing"
          />

          <!-- 右侧：详情面板容器 -->
          <div
            class="h-full overflow-hidden"
            :class="[
              splitViewStore.isResizing ? 'transition-none' : 'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
              splitViewStore.isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            ]"
            :style="{ width: splitViewStore.isMaximized ? '100%' : (splitViewStore.isOpen ? `calc(${splitViewStore.rightPanelWidth}% - ${isWidgetsOpen ? 326 : 0}px - 6px)` : '0px') }"
            @pointerdown="splitViewStore.focusRight()"
          >
            <div
              class="h-full bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden flex flex-col"
              :class="[
                splitViewStore.activeView === 'right'
                  ? 'border-cyan-400/60 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]'
                  : 'border-gray-200/50 dark:border-gray-800/50'
              ]"
            >
              <!-- Unified Split View Header Controls -->
              <AppWindowHeader
                v-if="splitViewStore.currentRightViewType !== 'music'"
                mode="split"
                :type="splitViewStore.currentRightViewType"
                :custom-title="splitViewTitle"
                :custom-icon="splitViewIcon"
                :is-maximized="splitViewStore.isMaximized"
              />

              <!-- Route to correct component based on content type -->
              <div class="flex-1 overflow-hidden">
                <AppUserProfile
                  v-if="splitViewStore.currentRightViewType === 'user' && splitViewStore.isOpen"
                  :key="`user-${splitViewStore.refreshKey}`"
                />
                <AppPostDetail
                  v-else-if="splitViewStore.currentRightViewType === 'post' && splitViewStore.isOpen"
                  :key="`post-${splitViewStore.refreshKey}`"
                />
                <AppMusicPlayer v-else-if="splitViewStore.currentRightViewType === 'music' && splitViewStore.isOpen" />
                <AppNotifications
                  v-else-if="splitViewStore.currentRightViewType === 'notifications' && splitViewStore.isOpen"
                  :key="`notif-${splitViewStore.refreshKey}`"
                />
                <AppChatDetail
                  v-else-if="splitViewStore.currentRightViewType === 'chat' && splitViewStore.isOpen"
                  :key="`chat-${splitViewStore.refreshKey}`"
                />
              </div>
            </div>
          </div>

          <!-- 独立的小组件视图 (Independent Widget Split View) -->
          <Transition name="widget-slide">
            <div
              v-if="isWidgetsOpen"
              class="h-full w-[320px] bg-white dark:bg-gray-900 rounded-[30px] border border-gray-200/50 dark:border-gray-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden shrink-0"
            >
              <AppWidgetsSidebar />
            </div>
          </Transition>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
/* 小组件从下往上渐显动画 */
.widget-slide-enter-active,
.widget-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.widget-slide-enter-from,
.widget-slide-leave-to {
  opacity: 0;
  transform: translateY(100px);
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(-100%);
  }
}
</style>
