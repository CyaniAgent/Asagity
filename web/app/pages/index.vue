<script setup lang="ts">
import { ref } from 'vue'
import { useSplitViewStore } from '~/stores/splitView'
import { useSystemStore } from '~/stores/system'

const splitViewStore = useSplitViewStore()
const systemStore = useSystemStore()

// Fetch timeline data from API
const { data: timelineData, pending: timelineLoading, error: timelineError, refresh: refreshTimeline } = useAsyncData('timeline', async () => {
  if (systemStore.isDevMode) {
    return []
  }

  try {
    const api = useApi()
    const response = await api.get('/api/timeline/public', {
      query: { limit: 20 }
    })
    return response as any[]
  } catch (err) {
    console.error('Failed to fetch timeline:', err)
    return []
  }
}, {
  default: () => []
})

const onlineUsersCount = ref(1288)
const onlineAvatars = [
  { src: 'https://avatars.githubusercontent.com/u/739984?v=4' },
  { src: 'https://avatars.githubusercontent.com/u/1?v=4' },
  { src: 'https://avatars.githubusercontent.com/u/2?v=4' },
  { src: 'https://avatars.githubusercontent.com/u/3?v=4' },
  { src: 'https://avatars.githubusercontent.com/u/4?v=4' }
]

const trendingTopics = [
  { name: 'Asagity', posts: '1.2k', trend: 'up' },
  { name: '日常', posts: '856', trend: 'up' },
  { name: 'Gakumasu', posts: '432', trend: 'stable' },
  { name: 'maimai', posts: '128', trend: 'down' }
]

const recommendedUsers = [
  { displayName: '静流', username: 'shizuru_official', avatar: 'https://avatars.githubusercontent.com/u/10?v=4' },
  { displayName: 'Vocaloid Producer', username: 'vocalo_p', avatar: 'https://avatars.githubusercontent.com/u/11?v=4' },
  { displayName: 'Miku_39', username: 'miku39', avatar: 'https://avatars.githubusercontent.com/u/12?v=4' }
]

const federatedInstances = [
  { domain: 'misskey.io', protocol: 'ActivityPub', active: 842 },
  { domain: 'asagity.net', protocol: 'NeoLinkage', active: 531 },
  { domain: 'mastodon.social', protocol: 'ActivityPub', active: 322 }
]
</script>

<template>
  <div class="max-w-[1150px] mx-auto w-full flex items-start gap-6 animate-[fade-in_0.4s_ease-out]">
    <!-- Left: Timeline Container -->
    <div class="flex-1 w-full flex flex-col gap-4">
      <!-- Main Feed Glass Container -->
      <div
        class="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-[30px] border border-white/20 dark:border-gray-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden"
      >
        <!-- Timeline Header -->
        <div
          class="px-6 py-4 border-b border-white/20 dark:border-gray-800/50 flex justify-between items-center bg-white/30 dark:bg-gray-800/30"
        >
          <h2 class="text-[18px] font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-wide">
            <UIcon
              name="i-material-symbols-public"
              class="w-5 h-5 text-cyan-500"
            /> 动态
          </h2>
          <UButton
            icon="i-material-symbols-tune"
            color="neutral"
            variant="ghost"
            class="rounded-full w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-white/50 dark:hover:bg-gray-700/50"
          />
        </div>

        <!-- Post Stream -->
        <div class="flex flex-col divide-y divide-white/40 dark:divide-gray-800/50">
          <template v-if="timelineLoading">
            <div class="flex items-center justify-center py-16">
              <UIcon
                name="i-material-symbols-progress-activity"
                class="animate-spin text-cyan-500 w-8 h-8"
              />
            </div>
          </template>
          <template v-else-if="!timelineData?.length">
            <AppEmptyState
              title="动态板块空空如也"
              description="暂无动态，快去关注一些有趣的用户吧！"
              icon="i-material-symbols-dynamic-feed"
            />
          </template>
          <template v-else>
            <AppPostItem
              v-for="post in timelineData"
              :key="post.id"
              :post="post"
              class="hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Right: Mini Widgets Sidebar (Preempted by Split View) -->
    <aside
      v-if="!splitViewStore.isOpen"
      class="hidden lg:flex flex-col w-[320px] shrink-0 gap-4 animate-[fade-in_0.3s_ease-out]"
    >
      <!-- Widget 1: Online Status -->
      <div
        class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <h3
          class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1.5"
        >
          <UIcon
            name="i-material-symbols-signal-cellular-alt"
            class="w-4 h-4 text-green-500"
          /> 在线情况
        </h3>
        <div class="flex items-center justify-between">
          <!-- Left: Count -->
          <div class="flex flex-col">
            <span class="text-[32px] font-black text-gray-900 dark:text-white leading-none tracking-tight">{{
              onlineUsersCount.toLocaleString() }}</span>
            <span class="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Active Now</span>
          </div>
          <!-- Right: Avatars -->
          <UAvatarGroup
            size="sm"
            :max="4"
            class="ring-2 ring-white/50 dark:ring-gray-800/50 rounded-full shadow-sm"
          >
            <UAvatar
              v-for="(user, idx) in onlineAvatars"
              :key="idx"
              :src="user.src"
            />
          </UAvatarGroup>
        </div>
      </div>

      <!-- Widget 2: Fresh Topics -->
      <div
        class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <h3
          class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1.5"
        >
          <UIcon
            name="i-material-symbols-trending-up"
            class="w-4 h-4 text-cyan-500"
          /> 新鲜的话题
        </h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="(topic, idx) in trendingTopics"
            :key="idx"
            class="flex items-center justify-between group cursor-pointer"
          >
            <div class="flex flex-col">
              <span
                class="text-[14px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-cyan-500 transition-colors"
              >#{{
                topic.name }}</span>
              <span class="text-[11px] font-bold text-gray-400">{{ topic.posts }} posts</span>
            </div>
            <UIcon
              :name="topic.trend === 'up' ? 'i-material-symbols-arrow-outward' : topic.trend === 'down' ? 'i-material-symbols-south-east' : 'i-material-symbols-arrow-right-alt'"
              class="w-4 h-4"
              :class="topic.trend === 'up' ? 'text-green-500' : topic.trend === 'down' ? 'text-red-400' : 'text-gray-300'"
            />
          </div>
        </div>
      </div>

      <!-- Widget 3: Recommended Follows -->
      <div
        class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <h3
          class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1.5"
        >
          <UIcon
            name="i-material-symbols-person-add"
            class="w-4 h-4 text-blue-500"
          /> 推荐关注
        </h3>
        <div class="flex flex-col gap-4">
          <div
            v-for="(user, idx) in recommendedUsers"
            :key="idx"
            class="flex items-center gap-3 group"
          >
            <UAvatar
              :src="user.avatar"
              size="md"
              class="transition-transform group-hover:scale-105"
            />
            <div class="flex flex-col flex-1 overflow-hidden">
              <span
                class="text-[14px] font-bold text-gray-900 dark:text-white truncate group-hover:text-cyan-500 transition-colors"
              >{{
                user.displayName }}</span>
              <span class="text-[11px] font-bold text-gray-400 truncate">@{{ user.username }}</span>
            </div>
            <UButton
              icon="i-material-symbols-add"
              size="xs"
              color="primary"
              variant="soft"
              class="rounded-full w-8 h-8 flex items-center justify-center shrink-0"
            />
          </div>
        </div>
      </div>

      <!-- Widget 4: Federated Instances -->
      <div
        class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <h3
          class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5"
        >
          <UIcon
            name="i-material-symbols-hub"
            class="w-4 h-4 text-purple-500"
          /> Asagity NET
        </h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="(instance, idx) in federatedInstances"
            :key="idx"
            class="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div class="flex flex-col">
              <span
                class="text-[13px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-cyan-500 transition-colors"
              >{{
                instance.domain }}</span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span
                  class="px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider"
                  :class="instance.protocol === 'ActivityPub' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400'"
                >
                  {{ instance.protocol }}
                </span>
                <span class="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
                  <UIcon
                    name="i-material-symbols-person"
                    class="w-3 h-3"
                  /> {{ instance.active }}
                </span>
              </div>
            </div>
            <UIcon
              name="i-material-symbols-chevron-right"
              class="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
