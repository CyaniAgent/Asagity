<script setup lang="ts">
import { computed } from 'vue'
import { useFreeWindowStore } from '~/stores/freeWindow'

const freeWindowStore = useFreeWindowStore()

const freeWindowTitle = computed(() => {
  const type = freeWindowStore.currentViewType
  switch (type) {
    case 'post': return '帖子详情'
    case 'user': return freeWindowStore.currentUser?.displayName || '用户主页'
    case 'music': return '音乐播放器'
    case 'notifications': return '通知中心'
    case 'chat': return freeWindowStore.currentChat?.name || 'Asagity Chat'
    case 'admin_database': return '数据库详细信息'
    default: return 'Free Window'
  }
})

const freeWindowIcon = computed(() => {
  const type = freeWindowStore.currentViewType
  switch (type) {
    case 'post': return 'i-material-symbols-article'
    case 'user': return 'i-material-symbols-person'
    case 'music': return 'i-material-symbols-music-note'
    case 'notifications': return 'i-material-symbols-notifications'
    case 'chat': return 'i-material-symbols-forum'
    case 'admin_database': return 'i-material-symbols-database'
    default: return 'i-material-symbols-tab-move'
  }
})

function handleClose() {
  freeWindowStore.close()
}
</script>

<template>
  <AppFreeWindow
    v-model="freeWindowStore.isOpen"
    :type="freeWindowStore.currentViewType || undefined"
    :title="freeWindowTitle"
    :icon="freeWindowIcon"
    @close="handleClose"
  >
    <AppUserProfile
      v-if="freeWindowStore.currentViewType === 'user'"
      :key="`user-${freeWindowStore.refreshKey}`"
    />
    <AppPostDetail
      v-else-if="freeWindowStore.currentViewType === 'post'"
      :key="`post-${freeWindowStore.refreshKey}`"
    />
    <AppMusicPlayer v-else-if="freeWindowStore.currentViewType === 'music'" />
    <AppNotifications
      v-else-if="freeWindowStore.currentViewType === 'notifications'"
      :key="`notif-${freeWindowStore.refreshKey}`"
    />
    <AppChatDetail
      v-else-if="freeWindowStore.currentViewType === 'chat'"
      :key="`chat-${freeWindowStore.refreshKey}`"
    />
    <AppDatabaseDetails
      v-else-if="freeWindowStore.currentViewType === 'admin_database'"
      :key="`admindb-${freeWindowStore.refreshKey}`"
    />
  </AppFreeWindow>
</template>
