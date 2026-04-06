<script setup lang="ts">
import { ref } from 'vue'
import { useSplitViewStore } from '~/stores/splitView'

const splitViewStore = useSplitViewStore()

const conversations = ref([
  {
    id: 1,
    name: 'inkink',
    username: '@inkink',
    avatar: 'https://avatars.githubusercontent.com/u/108230537?v=4',
    lastMessage: '您: 只是里面拉了bot来监测网站服务状态',
    time: '2天前',
    isGroup: false,
    unread: 0
  },
  {
    id: 2,
    name: 'yuzuki',
    username: '@yuzuki',
    avatar: 'https://avatars.githubusercontent.com/u/132144706?v=4',
    lastMessage: '我怎么去联合其他社区啊',
    time: '7天前',
    isGroup: false,
    unread: 1
  },
  {
    id: 3,
    name: '瞿十光',
    username: '@zhaishis',
    avatar: 'https://avatars.githubusercontent.com/u/11993425?v=4',
    lastMessage: '在吗',
    time: '2个月前',
    isGroup: false,
    unread: 0
  },
  {
    id: 4,
    name: '初音ミク',
    username: '@hatsunemiku',
    avatar: 'https://avatars.githubusercontent.com/u/739984?v=4',
    lastMessage: 'Bot: 准备打歌了！',
    time: '2个月前',
    isGroup: false,
    unread: 0
  },
  {
    id: 5,
    name: '技术交流群',
    username: '@tech_group',
    avatar: 'https://avatars.githubusercontent.com/u/45142163?v=4',
    lastMessage: 'Bot: 系统维护通知',
    time: '2个月前',
    isGroup: true,
    memberCount: 5,
    unread: 3
  }
])

useHead({
  title: '消息'
})
</script>

<template>
  <div class="flex flex-col gap-4 max-w-3xl mx-auto py-2 h-full">
    <!-- 头部栏: 历史与过滤 -->
    <div class="flex items-center justify-between text-gray-400 dark:text-gray-500 text-sm font-bold uppercase tracking-widest px-2 mb-2 border-b border-gray-200 dark:border-gray-800 pb-2">
      <span class="flex items-center gap-2">
        <UIcon name="i-material-symbols-history" class="w-4 h-4" />
        历史
      </span>
      <UButton icon="i-material-symbols-keyboard-arrow-up" color="neutral" variant="ghost" size="xs" class="rounded-full hover:bg-cyan-500/10 text-gray-400" />
    </div>

    <!-- 会话列表 -->
    <div class="flex flex-col gap-3 pb-8">
      <div 
        v-for="chat in conversations" 
        :key="chat.id"
        @click="splitViewStore.openChat(chat)"
        class="flex items-center gap-4 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md p-4 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 border border-white/50 dark:border-gray-700/50 hover:border-cyan-500/30 dark:hover:border-cyan-400/30 cursor-pointer group hover:-translate-y-0.5"
      >
        <!-- 左侧: 头像区 -->
        <div class="relative shrink-0">
          <UAvatar :src="chat.avatar" :alt="chat.name" size="xl" class="ring-2 ring-transparent group-hover:ring-cyan-500/50 transition-all duration-300 shadow-sm" />
          <!-- 状态点 (在线/新消息) -->
          <div v-if="chat.unread > 0" class="absolute -bottom-1 -right-1 w-5 h-5 bg-red-400 border-[2px] border-white dark:border-gray-800 rounded-full flex items-center justify-center pointer-events-none shadow-sm z-10">
             <span v-if="chat.unread > 1" class="text-[10px] font-black text-white leading-none pt-[1px]">{{ chat.unread }}</span>
             <span v-else class="w-2.5 h-2.5 bg-red-500 rounded-full mix-blend-screen"></span>
          </div>
          <div v-else class="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 border-[2px] border-white dark:border-gray-800 rounded-full pointer-events-none shadow-sm z-10" />
        </div>

        <!-- 中间: 信息区 -->
        <div class="flex flex-col flex-1 min-w-0 overflow-hidden text-left py-0.5 justify-center">
          <div class="flex items-center gap-2 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
            <span class="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{{ chat.name }}</span>
            <span v-if="chat.isGroup" class="text-[10px] font-black text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/60 px-1.5 py-0.5 rounded-md self-center">({{ chat.memberCount }}人)</span>
            <span class="text-[13px] font-semibold text-gray-400 dark:text-gray-500 shrink-0">{{ chat.username }}</span>
          </div>
          <p class="text-[14px] text-gray-600 dark:text-gray-300/80 font-medium truncate w-full" :class="chat.unread > 0 ? 'text-gray-900 dark:text-white font-bold' : ''">{{ chat.lastMessage }}</p>
        </div>

        <!-- 右侧: 时间戳与操作 -->
        <div class="flex flex-col items-end justify-start self-stretch shrink-0 py-1 pl-2">
          <span class="text-xs font-bold text-gray-400 dark:text-gray-500 transition-colors group-hover:text-cyan-500">{{ chat.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
