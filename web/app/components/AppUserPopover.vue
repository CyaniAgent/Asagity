<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useThemeStore } from '~/stores/theme'
import { useSystemStore } from '~/stores/system'

const userStore = useUserStore()
const themeStore = useThemeStore()
const systemStore = useSystemStore()

const emit = defineEmits(['close', 'action'])

// Mock stats - in a real app these would come from the store or an API
const stats = {
  following: 128,
  followers: 2048,
  posts: 512
}

function handleLogout() {
  userStore.logout()
  emit('close')
}

function handleAction(type: string) {
  emit('action', type)
  emit('close')
}
</script>

<template>
  <div
    class="w-72 bg-white/80 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[32px] border border-white/20 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col p-2 animate-[popover_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
    <!-- User Identity Section -->
    <div class="px-4 pt-6 pb-4 flex flex-col items-center text-center">
      <UAvatar :src="userStore.avatar" :alt="userStore.user?.name || userStore.username" size="xl"
        class="ring-4 ring-cyan-500/20 mb-4 hover:scale-105 transition-transform duration-300" />
      <div class="flex flex-col min-w-0 w-full">
        <span class="text-lg font-normal text-gray-900 dark:text-white truncate leading-tight">
          {{ userStore.user?.name || 'Anonymous' }}
        </span>
        <span class="text-sm font-normal text-gray-500 dark:text-gray-400 truncate">
          @{{ userStore.username }}
        </span>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-3 gap-1 px-2 py-4 border-y border-black/5 dark:border-white/5 my-2">
      <div class="flex flex-col items-center group cursor-pointer">
        <span class="text-sm font-normal text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">{{
          stats.following }}</span>
        <span class="text-[10px] font-normal text-gray-400 uppercase tracking-tight">已关注</span>
      </div>
      <div class="flex flex-col items-center group cursor-pointer border-x border-black/5 dark:border-white/5">
        <span class="text-sm font-normal text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">{{
          stats.followers }}</span>
        <span class="text-[10px] font-normal text-gray-400 uppercase tracking-tight">关注者</span>
      </div>
      <div class="flex flex-col items-center group cursor-pointer">
        <span class="text-sm font-normal text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">{{
          stats.posts }}</span>
        <span class="text-[10px] font-normal text-gray-400 uppercase tracking-tight">发帖</span>
      </div>
    </div>

    <!-- Menu Actions -->
    <div class="flex flex-col gap-0.5 px-1 pb-2">
      <button class="menu-item" @click="handleAction('settings')">
        <UIcon name="i-material-symbols-settings-outline-rounded" class="w-5 h-5 opacity-70" />
        用户设置
      </button>
      <button class="menu-item" @click="handleAction('mood')">
        <UIcon name="i-material-symbols-edit-note-rounded" class="w-5 h-5 opacity-70" />
        记录心情...
      </button>

      <div class="h-px bg-black/5 dark:bg-white/5 my-1.5 mx-3" />

      <button class="menu-item justify-between group" @click="themeStore.toggle()">
        <div class="flex items-center gap-3">
          <UIcon :name="themeStore.modeIcon" class="w-5 h-5 opacity-70" />
          深浅色模式切换
        </div>
        <span class="text-[10px] font-normal opacity-40 group-hover:opacity-100 transition-opacity">
          {{ themeStore.modeLabel }}
        </span>
      </button>

      <div class="h-px bg-black/5 dark:bg-white/5 my-1.5 mx-3" />

      <button class="menu-item" @click="handleAction('switch')">
        <UIcon name="i-material-symbols-switch-account-outline-rounded" class="w-5 h-5 opacity-70" />
        切换账号
      </button>
      <button class="menu-item text-red-500 hover:bg-red-500/10 hover:text-red-600" @click="handleLogout">
        <UIcon name="i-material-symbols-logout-rounded" class="w-5 h-5 opacity-70" />
        退出登录
      </button>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 400;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.menu-item:hover {
  background-color: rgba(57, 197, 187, 0.1);
  color: var(--color-cyan-600);
}

.dark .menu-item:hover {
  color: var(--color-cyan-400);
}

@keyframes popover {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
