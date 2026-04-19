<script setup lang="ts">
import { ref } from 'vue'

const onlineUsersCount = ref(1)
const onlineAvatars: { src: string }[] = []

const trendingTopics: { name: string, posts: string, trend: string }[] = []

const recommendedUsers: { displayName: string, username: string, avatar: string }[] = []

const federatedInstances: { domain: string, protocol: string, active: number }[] = []
</script>

<template>
  <div class="flex flex-col gap-6 p-6 h-full overflow-y-auto custom-scrollbar">
    <!-- Widget 1: Online Status -->
    <div
      class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1.5">
        <UIcon
          name="i-material-symbols-signal-cellular-alt"
          class="w-4 h-4 text-green-500"
        /> 在线情况
      </h3>
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[32px] font-black text-gray-900 dark:text-white leading-none tracking-tight">{{ onlineUsersCount }}</span>
          <span class="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Active Now</span>
        </div>
        <div
          v-if="onlineAvatars.length > 0"
          class="shrink-0"
        >
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
    </div>

    <!-- Widget 2: Fresh Topics -->
    <div
      class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1.5">
        <UIcon
          name="i-material-symbols-trending-up"
          class="w-4 h-4 text-cyan-500"
        /> 新鲜的话题
      </h3>
      <template v-if="trendingTopics.length > 0">
        <div class="flex flex-col gap-3">
          <div
            v-for="(topic, idx) in trendingTopics"
            :key="idx"
            class="flex items-center justify-between group cursor-pointer"
          >
            <div class="flex flex-col">
              <span class="text-[14px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-cyan-500 transition-colors">#{{ topic.name }}</span>
              <span class="text-[11px] font-bold text-gray-400">{{ topic.posts }} posts</span>
            </div>
            <UIcon
              :name="topic.trend === 'up' ? 'i-material-symbols-arrow-outward' : topic.trend === 'down' ? 'i-material-symbols-south-east' : 'i-material-symbols-arrow-right-alt'"
              class="w-4 h-4"
              :class="topic.trend === 'up' ? 'text-green-500' : topic.trend === 'down' ? 'text-red-400' : 'text-gray-300'"
            />
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center py-6 text-gray-400">
          <UIcon
            name="i-material-symbols-tag"
            class="w-8 h-8 mb-2 opacity-50"
          />
          <span class="text-[12px] font-medium">暂无话题</span>
        </div>
      </template>
    </div>

    <!-- Widget 3: Recommended Follows -->
    <div
      class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1.5">
        <UIcon
          name="i-material-symbols-person-add"
          class="w-4 h-4 text-blue-500"
        /> 推荐关注
      </h3>
      <template v-if="recommendedUsers.length > 0">
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
              <span class="text-[14px] font-bold text-gray-900 dark:text-white truncate group-hover:text-cyan-500 transition-colors">{{ user.displayName }}</span>
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
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center py-6 text-gray-400">
          <UIcon
            name="i-material-symbols-person-add"
            class="w-8 h-8 mb-2 opacity-50"
          />
          <span class="text-[12px] font-medium">暂无推荐</span>
        </div>
      </template>
    </div>

    <!-- Widget 4: Federated Instances -->
    <div
      class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-[24px] border border-white/30 dark:border-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 class="text-[13px] font-black tracking-widest text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
        <UIcon
          name="i-material-symbols-hub"
          class="w-4 h-4 text-purple-500"
        /> Asagity NET
      </h3>
      <template v-if="federatedInstances.length > 0">
        <div class="flex flex-col gap-3">
          <div
            v-for="(instance, idx) in federatedInstances"
            :key="idx"
            class="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div class="flex flex-col">
              <span class="text-[13px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-cyan-500 transition-colors">{{ instance.domain }}</span>
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
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center py-6 text-gray-400">
          <UIcon
            name="i-material-symbols-hub"
            class="w-8 h-8 mb-2 opacity-50"
          />
          <span class="text-[12px] font-medium">暂无联邦实例</span>
        </div>
      </template>
    </div>
  </div>
</template>
