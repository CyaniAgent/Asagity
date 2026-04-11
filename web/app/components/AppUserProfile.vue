<script setup lang="ts">
import { useSplitViewStore } from '~/stores/splitView'

const splitViewStore = useSplitViewStore()

const profileTabs = [
  { label: '首页', value: 'home' },
  { label: '动态', value: 'posts' },
  { label: '文件', value: 'files' },
  { label: 'Raw 数据', value: 'raw' }
]
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">

    <!-- Scrollable content area -->
    <div
      v-if="splitViewStore.currentUser"
      class="flex-1 overflow-y-auto custom-scrollbar"
    >
      <!-- === Banner & Avatar Section (Anime Style) === -->
      <div class="relative group">
        <!-- Banner with Glassmorphism Overlay -->
        <div class="h-44 w-full overflow-hidden relative">
          <img
            v-if="splitViewStore.currentUser.banner"
            :src="splitViewStore.currentUser.banner"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Banner"
          >
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-[#39C5BB]/80 via-[#2EAFB0] to-[#2496A1]"
          />
          <!-- Decorative Stage Light Effect -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>

        <!-- Medium-sized Avatar (balanced - Misskey Style Lite) -->
        <div class="absolute -bottom-12 left-6 z-10">
          <div class="relative inline-block group/avatar">
            <UAvatar
              :src="splitViewStore.currentUser.avatar"
              :alt="splitViewStore.currentUser.displayName"
              class="w-24 h-24 md:w-32 md:h-32 ring-[5px] ring-white dark:ring-gray-950 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover/avatar:scale-105"
            />
            <!-- Decorative Badge/Status indicator placeholder -->
            <div class="absolute bottom-1 right-1 w-6 h-6 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center border-2 border-cyan-500 shadow-sm">
              <span class="text-cyan-500 text-sm">✨</span>
            </div>
          </div>
        </div>
      </div>

      <!-- === Right-side Action Section (Below Banner) === -->
      <div class="flex justify-end px-6 pt-4 min-h-[50px]">
        <div class="flex gap-2 items-center">
          <UButton
            label="关注 (Follow)"
            color="primary"
            size="md"
            class="rounded-full px-8 font-black shadow-[0_0_20px_rgba(57,197,187,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(57,197,187,0.6)] bg-gradient-to-r from-[#39C5BB] to-[#14c9c9] border-none text-white"
          />
          <UButton
            icon="i-material-symbols-more-horiz"
            variant="ghost"
            color="neutral"
            class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          />
        </div>
      </div>

      <!-- === Primary Info Section === -->
      <div class="pt-6 px-6 pb-4">
        <div>
          <h2 class="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight flex items-center gap-2">
            {{ splitViewStore.currentUser.displayName }}
            <UIcon
              v-if="splitViewStore.currentUser.isVerified"
              name="i-material-symbols-check-circle"
              class="w-5 h-5 text-cyan-500"
            />
          </h2>
          <p class="text-[15px] font-medium text-gray-400 dark:text-gray-500 mt-1 select-all">
            @{{ splitViewStore.currentUser.username }}@{{ splitViewStore.currentUser.instance || 'local' }}
          </p>
        </div>

        <!-- Bio (MFM rendered + Anime Styling) -->
        <div
          v-if="splitViewStore.currentUser.bio"
          class="mt-5 text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed bg-cyan-50/30 dark:bg-cyan-900/10 p-4 rounded-[20px] border border-cyan-100/50 dark:border-cyan-800/20 backdrop-blur-sm"
        >
          <MfmRenderer :text="splitViewStore.currentUser.bio" />
        </div>

        <!-- Metadata Row with Glass Icons -->
        <div class="flex flex-wrap gap-x-6 gap-y-2 mt-5">
          <span
            v-if="splitViewStore.currentUser.location"
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            <UIcon
              name="i-material-symbols-location-on"
              class="w-4 h-4 text-cyan-500"
            />
            {{ splitViewStore.currentUser.location }}
          </span>
          <span
            v-if="splitViewStore.currentUser.birthday"
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            <UIcon
              name="i-material-symbols-cake"
              class="w-4 h-4 text-pink-400"
            />
            {{ splitViewStore.currentUser.birthday }}
          </span>
          <span
            v-if="splitViewStore.currentUser.joinedAt"
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            <UIcon
              name="i-material-symbols-event"
              class="w-4 h-4 text-cyan-500"
            />
            注册于 {{ splitViewStore.currentUser.joinedAt }}
          </span>
        </div>

        <!-- Stats Grid (Anime Style) -->
        <div class="grid grid-cols-3 gap-1 mt-6 p-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-[25px] border border-gray-100 dark:border-gray-800/50 shadow-sm">
          <div class="flex flex-col items-center py-3 px-2 cursor-pointer hover:bg-white dark:hover:bg-gray-700/50 rounded-[20px] transition-all duration-300 group">
            <span class="font-black text-xl text-gray-900 dark:text-gray-100 group-hover:text-cyan-500 transition-colors">
              {{ splitViewStore.currentUser.stats?.posts ?? 0 }}
            </span>
            <span class="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">POSTS</span>
          </div>
          <div class="flex flex-col items-center py-3 px-2 cursor-pointer hover:bg-white dark:hover:bg-gray-700/50 rounded-[20px] transition-all duration-300 group">
            <span class="font-black text-xl text-gray-900 dark:text-gray-100 group-hover:text-cyan-500 transition-colors">
              {{ splitViewStore.currentUser.stats?.following ?? 0 }}
            </span>
            <span class="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">FOLLOWING</span>
          </div>
          <div class="flex flex-col items-center py-3 px-2 cursor-pointer hover:bg-white dark:hover:bg-gray-700/50 rounded-[20px] transition-all duration-300 group">
            <span class="font-black text-xl text-gray-900 dark:text-gray-100 group-hover:text-cyan-500 transition-colors">
              {{ splitViewStore.currentUser.stats?.followers ?? 0 }}
            </span>
            <span class="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">FOLLOWERS</span>
          </div>
        </div>
      </div>

      <!-- === Profile Tabs === -->
      <div class="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-10 px-2">
        <nav
          class="flex space-x-4"
          aria-label="Profile tabs"
        >
          <button
            v-for="tab in profileTabs"
            :key="tab.value"
            :class="[
              splitViewStore.profileTab === tab.value
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 border-b-2'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-b-2 hover:border-gray-300',
              'whitespace-nowrap py-3 px-1 font-medium text-sm transition-colors duration-200'
            ]"
            @click="splitViewStore.setProfileTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- === Tab Content === -->
      <div class="p-4">
        <!-- Home tab: placeholder for pinned posts -->
        <div
          v-if="splitViewStore.profileTab === 'home'"
          class="text-center text-gray-400 py-8 text-sm"
        >
          暂无置顶内容
        </div>
        <div
          v-else
          class="text-center text-gray-400 py-8 text-sm"
        >
          模块开发中...
        </div>
      </div>
    </div>
  </div>
</template>
