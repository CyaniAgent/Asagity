<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNotificationStore, type NotificationType } from '~/stores/notifications'
import { useSplitViewStore } from '~/stores/splitView'

const notificationStore = useNotificationStore()
const splitViewStore = useSplitViewStore()

const activeTab = ref<'all' | NotificationType>('all')

const tabs = [
  { label: '全部', value: 'all' },
  { label: '提及', value: 'mention' },
  { label: '打赏', value: 'tip' },
  { label: '系统', value: 'system' }
]

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') return notificationStore.notifications
  return notificationStore.notifications.filter(n => n.type === activeTab.value)
})

function getIcon(type: NotificationType) {
  switch (type) {
    case 'mention': return 'i-material-symbols-alternate-email'
    case 'tip': return 'i-material-symbols-savings'
    case 'system': return 'i-material-symbols-info'
    case 'reblog': return 'i-material-symbols-repeat'
    case 'reaction': return 'i-material-symbols-favorite'
    default: return 'i-material-symbols-notifications'
  }
}

function getIconColor(type: NotificationType) {
  switch (type) {
    case 'mention': return 'text-cyan-400'
    case 'tip': return 'text-yellow-400'
    case 'system': return 'text-primary-400'
    default: return 'text-gray-400'
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden font-sans">
    <!-- Tabs & Actions Row -->
    <div class="px-4 py-2 bg-gray-100/50 dark:bg-black/10 shrink-0 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
      <div class="flex gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === tab.value ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-900/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'"
          @click="activeTab = tab.value as any"
        >
          {{ tab.label }}
        </button>
      </div>

      <UButton
        icon="i-material-symbols-done-all"
        label="全部已读"
        variant="ghost"
        color="neutral"
        size="xs"
        class="text-[10px] uppercase font-black tracking-widest text-gray-900/40 dark:text-white/40 hover:text-cyan-500"
        @click="notificationStore.markAllAsRead()"
      />
    </div>

    <!-- Notification List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
      <TransitionGroup name="list">
        <div
          v-for="notify in filteredNotifications"
          :key="notify.id"
          class="group relative p-4 rounded-3xl border transition-all duration-300 hover:scale-[1.01]"
          :class="[
            notify.isRead
              ? 'bg-white/40 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 grayscale-[0.3] opacity-80'
              : 'bg-white dark:bg-white/[0.05] border-primary-500/20 shadow-sm dark:shadow-lg ring-1 ring-primary-500/10'
          ]"
          @click="notificationStore.markAsRead(notify.id)"
        >
          <!-- Unread Dot -->
          <div
            v-if="!notify.isRead"
            class="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-500 animate-pulse"
          />

          <div class="flex gap-4">
            <!-- Icon/Avatar Section -->
            <div class="shrink-0 relative">
              <template v-if="notify.user">
                <UAvatar
                  :src="notify.user.avatar"
                  :alt="notify.user.name"
                  size="md"
                  class="ring-2 ring-gray-100 dark:ring-white/10"
                />
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-[#121212] flex items-center justify-center p-0.5 shadow-sm">
                  <UIcon
                    :name="getIcon(notify.type)"
                    :class="['w-3.5 h-3.5', getIconColor(notify.type)]"
                  />
                </div>
              </template>
              <div
                v-else
                class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
              >
                <UIcon
                  :name="getIcon(notify.type)"
                  :class="['w-6 h-6', getIconColor(notify.type)]"
                />
              </div>
            </div>

            <!-- Content Section -->
            <div class="flex-1 min-w-0 space-y-1">
              <div class="flex justify-between items-start gap-2">
                <div class="font-black text-sm truncate flex items-center gap-1.5">
                  <span v-if="notify.user">{{ notify.user.name }}</span>
                  <span
                    v-else
                    class="text-primary-600 dark:text-primary-400"
                  >系统通知</span>
                  <span
                    v-if="notify.user"
                    class="text-gray-900/30 dark:text-white/30 font-bold text-xs"
                  >@{{ notify.user.username }}</span>
                </div>
                <span class="text-[10px] font-bold text-gray-900/20 dark:text-white/20 whitespace-nowrap">{{ formatDate(notify.createdAt) }}</span>
              </div>

              <div class="text-sm text-gray-900/70 dark:text-white/70 leading-relaxed break-words">
                <template v-if="notify.type === 'mention' && notify.post">
                  提及了你：<span class="text-gray-900 dark:text-white font-medium">{{ notify.post.content }}</span>
                </template>
                <template v-else>
                  {{ notify.content }}
                </template>
              </div>

              <!-- Action Footer (Optional) -->
              <div
                v-if="!notify.isRead"
                class="pt-2"
              >
                <UButton
                  label="点击查看详情"
                  variant="link"
                  size="xs"
                  class="p-0 text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-bold text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div
        v-if="filteredNotifications.length === 0"
        class="flex flex-col items-center justify-center py-20 opacity-20"
      >
        <UIcon
          name="i-material-symbols-inbox"
          class="w-16 h-16 mb-4 text-gray-900 dark:text-white"
        />
        <p class="text-sm font-black tracking-widest">
          暂时没有相关通知
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
