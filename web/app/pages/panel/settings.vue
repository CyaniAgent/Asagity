<script setup lang="ts">
const route = useRoute()

const categories = [
  {
    label: '实例管理 (INSTANCE)',
    items: [
      { label: '实例信息', icon: 'i-material-symbols-info-outline', to: '/panel/settings/instance/info' },
      { label: '全局个性化', icon: 'i-material-symbols-palette-outline', to: '/panel/settings/instance/theme' },
      { label: '用户', icon: 'i-material-symbols-person-outline', to: '/panel/settings/instance/users' },
      { label: '用户组', icon: 'i-material-symbols-groups-outline', to: '/panel/settings/instance/user-groups' },
      { label: 'Invite Key', icon: 'i-material-symbols-key-outline', to: '/panel/settings/instance/invites' },
      { label: '表情符号', icon: 'i-material-symbols-mood', to: '/panel/settings/instance/emojis' },
    ]
  },
  {
    label: '资源管理 (RESOURCES)',
    items: [
      { label: 'Skyline 云盘', icon: 'i-material-symbols-cloud-outline', to: '/panel/settings/instance/drive' },
      { label: '邮件服务器', icon: 'i-material-symbols-mail-outline', to: '/panel/settings/instance/mail' },
    ]
  },
  {
    label: '系统维护 (SYSTEM)',
    items: [
      { label: '负载与性能', icon: 'i-material-symbols-speed-outline', to: '/panel/settings/instance/performance' }
    ]
  }
]

onMounted(() => {
  if (route.path === '/panel/settings' || route.path === '/panel/settings/') {
    useRouter().push('/panel/settings/instance/info')
  }
})
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-[fade-in_0.4s_ease-out]">
    <!-- Main Content Layout (1:3 Ratio) -->
    <div class="flex-1 flex gap-6 overflow-hidden">
      <!-- Left: Vertical Navigation (1 part) -->
      <aside class="w-1/4 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
        <div v-for="cat in categories" :key="cat.label" class="flex flex-col gap-1.5">
          <div class="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-60">
            {{ cat.label }}
          </div>
          <NuxtLink
            v-for="item in cat.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group"
            :class="route.path === item.to 
              ? 'bg-cyan-500 text-white shadow-[0_8px_20px_-4px_rgba(6,182,212,0.4)]' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-bold'"
          >
            <UIcon 
              :name="item.icon" 
              class="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
              :class="route.path === item.to ? 'text-white' : 'text-gray-400 group-hover:text-cyan-500'"
            />
            <span class="text-[14px] tracking-wide">{{ item.label }}</span>
            <UIcon 
              v-if="route.path === item.to" 
              name="i-material-symbols-chevron-right" 
              class="ml-auto w-4 h-4 animate-[bounce-x_1s_infinite]" 
            />
          </NuxtLink>
        </div>
      </aside>

      <!-- Right: Content Display Area (3 parts) -->
      <main class="flex-1 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 rounded-[32px] overflow-hidden shadow-xl flex flex-col">
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce-x {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

/* 隐藏滚动条但保留滚动功能 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937;
}
</style>
