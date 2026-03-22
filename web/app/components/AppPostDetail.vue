<script setup lang="ts">
import { useSplitViewStore } from '~/stores/splitView'

const splitViewStore = useSplitViewStore()

// Mock data for tabs
const comments = [
  { id: 1, author: 'User A', text: 'This is a great update!' },
  { id: 2, author: 'User B', text: 'Looking forward to more features.' }
]

const tabs = [
  { label: '评论 (Comments)', value: 'comments' },
  { label: '回复 (Replies)', value: 'replies' },
  { label: '转发 (Reposts)', value: 'reposts' },
  { label: '回应 (Reactions)', value: 'reactions' }
]
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200/50 dark:border-gray-800/50">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-800/20 backdrop-blur">
      <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-wide">
        帖子详情
      </h2>
      <UButton
        icon="i-material-symbols-close"
        color="neutral"
        variant="ghost"
        class="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors rounded-full"
        @click="splitViewStore.close()"
      />
    </div>

    <!-- Body - Scrollable content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <!-- Original Post -->
      <div
        v-if="splitViewStore.currentPost"
        class="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
      >
        <AppPostItem
          :post="splitViewStore.currentPost"
          :is-detail-view="true"
        />
      </div>

      <!-- Tabs Navigation -->
      <div class="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur z-10 px-2">
        <nav
          class="flex space-x-4"
          aria-label="Tabs"
        >
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="[
              splitViewStore.activeTab === tab.value
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 border-b-2'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-b-2 hover:border-gray-300',
              'whitespace-nowrap py-3 px-1 font-medium text-sm transition-colors duration-200'
            ]"
            @click="splitViewStore.setTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content Area -->
      <div class="p-4">
        <div
          v-if="splitViewStore.activeTab === 'comments'"
          class="space-y-4"
        >
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
          >
            <span class="font-bold text-sm text-gray-800 dark:text-gray-200">{{ comment.author }}: </span>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ comment.text }}</span>
          </div>
          <div
            v-if="comments.length === 0"
            class="text-center text-gray-400 py-8"
          >
            暂无评论
          </div>
        </div>
        <div
          v-else
          class="text-center text-gray-400 py-8"
        >
          模块开发中...
        </div>
      </div>
    </div>
  </div>
</template>
