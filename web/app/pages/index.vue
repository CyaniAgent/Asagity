<script setup lang="ts">
import { subHours, subMinutes } from 'date-fns'

const mockPosts = [
  {
    id: '1',
    author: {
      avatar: 'https://avatars.githubusercontent.com/u/739984?v=4',
      displayName: '绝对领域SK',
      username: 'syskuku'
    },
    createdAt: subHours(new Date(), 1),
    content: '这就去写一个新的长篇小说！大家有什么$[tada 想看的题材]吗？ $[rainbow #Asagity]',
    metrics: { replies: 5, reposts: 12, reactions: 42 }
  },
  {
    id: '2',
    author: {
      avatar: 'https://avatars.githubusercontent.com/u/739984?v=4',
      displayName: 'Little',
      username: 'Little',
      instance: 'misskey.io'
    },
    createdAt: subMinutes(new Date(), 45),
    content: '@syskuku 我用服务器部署的，请了也没事 $[spin.speed=2s 🌀]',
    replyTo: {
      author: {
        avatar: 'https://avatars.githubusercontent.com/u/739984?v=4',
        displayName: '绝对领域SK',
        username: 'syskuku'
      }
    },
    metrics: { replies: 2, reposts: 0, reactions: 15 }
  },
  {
    id: '3',
    author: {
      avatar: 'https://avatars.githubusercontent.com/u/739984?v=4',
      displayName: 'Yuna',
      username: 'yuna_ayase'
    },
    createdAt: subMinutes(new Date(), 10),
    content: '今天天气真不错喵~ 想出去散步。 #日常 $[shake 🐾]',
    metrics: { replies: 1, reposts: 1, reactions: 8 }
  }
]
</script>

<template>
  <div class="max-w-[700px] mx-auto space-y-6">
    <!-- 发布器占位符 -->
    <div
      class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] p-4 shadow-sm flex items-start gap-4"
    >
      <UAvatar
        src="https://avatars.githubusercontent.com/u/739984?v=4"
        size="md"
      />
      <div class="flex-1">
        <textarea
          class="w-full bg-transparent resize-none outline-none text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[60px] custom-scrollbar"
          placeholder="有什么新鲜事？"
        />
        <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div class="flex gap-1 text-cyan-500">
            <UButton
              icon="i-material-symbols-image"
              color="neutral"
              variant="ghost"
              size="sm"
              class="hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-full"
            />
            <UButton
              icon="i-material-symbols-sentiment-satisfied"
              color="neutral"
              variant="ghost"
              size="sm"
              class="hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-full"
            />
          </div>
          <UButton
            label="发送"
            color="primary"
            class="rounded-full px-5 font-bold shadow-sm shadow-cyan-500/30"
          />
        </div>
      </div>
    </div>

    <!-- 动态流 (无外边框的列表) -->
    <div
      class="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 flex flex-col shadow-sm"
    >
      <AppPostItem
        v-for="post in mockPosts"
        :key="post.id"
        :post="post"
      />
    </div>
  </div>
</template>
