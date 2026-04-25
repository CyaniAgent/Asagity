<script setup lang="ts">
import { useSplitViewStore } from '~/stores/splitView'
import { useFreeWindowStore } from '~/stores/freeWindow'

const props = defineProps<{
  mode: 'split' | 'free'
  type: 'post' | 'user' | 'music' | 'notifications' | 'chat' | string | null
  customTitle?: string
  customIcon?: string
  isMaximized?: boolean
  isMinimized?: boolean
  disableTransfer?: boolean // Disable the split-to-free transfer button (e.g. for lyrics window)
  disableMaximize?: boolean // Disable maximize button
  disableMinimize?: boolean // Disable minimize button
}>()

const emit = defineEmits(['close', 'toggle-maximize', 'toggle-minimize', 'refresh'])

const splitViewStore = useSplitViewStore()
const freeWindowStore = useFreeWindowStore()

function getIcon(type: string | null) {
  if (props.customIcon) return props.customIcon
  switch (type) {
    case 'post': return 'i-material-symbols-article'
    case 'user': return 'i-material-symbols-person'
    case 'music': return 'i-material-symbols-music-note'
    case 'notifications': return 'i-material-symbols-notifications'
    case 'chat': return 'i-material-symbols-forum'
    default: return props.mode === 'split' ? 'i-material-symbols-dock-to-left' : 'i-material-symbols-tab-move'
  }
}

function getTitle(type: string | null) {
  if (props.customTitle) return props.customTitle
  switch (type) {
    case 'post': return '帖子详情'
    case 'user': return '用户主页'
    case 'music': return '音乐播放器'
    case 'notifications': return '通知中心'
    case 'chat': return 'Asagity Chat'
    default: return props.mode === 'split' ? 'Split View' : 'Free Window'
  }
}

function handleRefresh() {
  if (props.disableTransfer) {
    emit('refresh')
    return
  }
  if (props.mode === 'split') splitViewStore.triggerRefresh()
  else freeWindowStore.triggerRefresh()
}

function toggleMaximize() {
  emit('toggle-maximize')
  if (props.disableTransfer) return
  if (props.mode === 'split') splitViewStore.toggleMaximize()
  else freeWindowStore.toggleMaximize()
}

function toggleMinimize() {
  emit('toggle-minimize')
  if (props.disableTransfer) return
  if (props.mode === 'free') freeWindowStore.toggleMinimize()
}

function handleClose() {
  emit('close')
  if (props.disableTransfer) return
  if (props.mode === 'split') splitViewStore.close()
  else freeWindowStore.close()
}

function switchMode() {
  if (props.disableTransfer) return

  if (props.mode === 'split') {
    if (splitViewStore.currentRightViewType) {
      freeWindowStore.openFromContext(splitViewStore.currentRightViewType as 'post' | 'user' | 'music' | 'notifications' | 'chat' | 'admin_database', {
        post: splitViewStore.currentPost,
        user: splitViewStore.currentUser,
        chat: splitViewStore.currentChat
      }, {
        activeTab: splitViewStore.activeTab,
        profileTab: splitViewStore.profileTab
      })
    }
    splitViewStore.close()
  } else {
    if (freeWindowStore.currentViewType) {
      splitViewStore.currentRightViewType = freeWindowStore.currentViewType as 'post' | 'user' | 'music' | 'notifications' | 'chat'
    }
    splitViewStore.currentPost = freeWindowStore.currentPost
    splitViewStore.currentUser = freeWindowStore.currentUser
    splitViewStore.currentChat = freeWindowStore.currentChat
    splitViewStore.activeTab = freeWindowStore.activeTab
    splitViewStore.profileTab = freeWindowStore.profileTab

    splitViewStore.isOpen = true
    splitViewStore.isMaximized = false
    splitViewStore.activeView = 'right'
    if (freeWindowStore.currentViewType === 'music') splitViewStore.rightPanelWidth = 38
    else if (freeWindowStore.currentViewType === 'notifications') splitViewStore.rightPanelWidth = 40
    else if (freeWindowStore.currentViewType === 'chat') splitViewStore.rightPanelWidth = 45
    else splitViewStore.rightPanelWidth = 50

    freeWindowStore.close()
  }
}
</script>

<template>
  <div class="px-4 py-3 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 shrink-0 drag-handle rounded-t-[30px] select-none">
    <div class="flex items-center gap-2 overflow-hidden max-w-[50%]">
      <div class="w-7 h-7 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-white/5">
        <UIcon
          :name="getIcon(type)"
          class="w-4 h-4 text-cyan-600 dark:text-cyan-400"
        />
      </div>
      <span class="text-[13px] font-black text-gray-800 dark:text-white truncate tracking-wide">
        {{ getTitle(type) }}
      </span>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <UTooltip
        v-if="!disableTransfer"
        text="刷新"
        :popper="{ placement: 'bottom' }"
      >
        <UButton
          icon="i-material-symbols-refresh"
          color="neutral"
          variant="ghost"
          size="xs"
          class="rounded-full text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-white/10"
          @click="handleRefresh"
        />
      </UTooltip>

      <UTooltip
        v-if="!disableTransfer"
        :text="mode === 'split' ? '在自由窗口打开' : '在拆分视图中打开'"
        :popper="{ placement: 'bottom' }"
      >
        <UButton
          :icon="mode === 'split' ? 'i-material-symbols-tab-move' : 'i-material-symbols-dock-to-right'"
          color="neutral"
          variant="ghost"
          size="xs"
          class="rounded-full text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/10"
          @click="switchMode"
        />
      </UTooltip>

      <UTooltip
        v-if="mode === 'free' && !disableMinimize"
        text="最小化"
        :popper="{ placement: 'bottom' }"
      >
        <UButton
          icon="i-material-symbols-minimize"
          color="neutral"
          variant="ghost"
          size="xs"
          class="rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
          @click="toggleMinimize"
        />
      </UTooltip>

      <UTooltip
        v-if="mode === 'free' && !disableMaximize"
        :text="isMaximized ? '还原' : '最大化'"
        :popper="{ placement: 'bottom' }"
      >
        <UButton
          :icon="isMaximized ? 'i-material-symbols-close-fullscreen' : 'i-material-symbols-open-in-full'"
          color="neutral"
          variant="ghost"
          size="xs"
          class="rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
          @click="toggleMaximize"
        />
      </UTooltip>

      <div class="w-px h-3.5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

      <UTooltip
        text="关闭"
        :popper="{ placement: 'bottom-end' }"
      >
        <UButton
          icon="i-material-symbols-close"
          color="error"
          variant="ghost"
          size="xs"
          class="rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-colors"
          @click="handleClose"
        />
      </UTooltip>
    </div>
  </div>
</template>

<style scoped>
.drag-handle {
  cursor: grab;
}
.drag-handle:active {
  cursor: grabbing;
}
</style>
