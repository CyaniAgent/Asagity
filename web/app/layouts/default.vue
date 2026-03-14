<script setup lang="ts">
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
    { label: '仅本服务器', icon: 'i-lucide-server', to: '/local' }
  ]
]
</script>

<template>
  <div class="h-screen w-screen flex bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans">
    <!-- 左侧：主导航栏 (与上方布局合并) -->
    <aside class="w-64 h-full flex flex-col shrink-0 z-20">
      <!-- 顶部 Logo -->
      <div class="h-16 flex items-center justify-between px-6 shrink-0">
        <span class="text-2xl font-black bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent italic tracking-wider transform -skew-x-6 drop-shadow-sm">
          Asagity
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
        <!-- 左/中：子导航栏 -->
        <div class="flex items-center">
          <UNavigationMenu
            :items="tabs"
            class="w-full"
          />
        </div>

        <!-- 右侧：小组件 -->
        <div class="flex items-center gap-4">
          <!-- 音乐播放器组件 (占位) -->
          <div class="flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full pr-2 pl-1 py-1 border border-white/20 dark:border-gray-700/50 shadow-sm transition-all hover:scale-105 cursor-pointer">
            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 animate-[spin_4s_linear_infinite] shrink-0 drop-shadow-sm" />
            <div class="w-24 overflow-hidden mask-image:linear-gradient(to_right,white_80%,transparent)">
              <div class="text-xs font-medium whitespace-nowrap animate-[marquee_10s_linear_infinite] inline-block text-gray-700 dark:text-gray-300">
                ♪ Tell Your World - kz(livetune)
              </div>
            </div>
            <UButton
              icon="i-lucide-play"
              color="neutral"
              variant="ghost"
              size="xs"
              class="rounded-full"
            />
          </div>

          <!-- 通知按钮 -->
          <div class="relative flex items-center justify-center">
            <UButton
              icon="i-lucide-bell"
              color="neutral"
              variant="ghost"
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

      <!-- 下半部分：显示区域 (圆角化 30px) -->
      <div class="flex-1 overflow-hidden p-4 pt-0">
        <div class="h-full w-full bg-white dark:bg-gray-900 rounded-[30px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-200/50 dark:border-gray-800/50 flex flex-col overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
            <slot />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
</style>
