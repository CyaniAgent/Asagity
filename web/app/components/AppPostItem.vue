<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNowStrict } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useSplitViewStore } from '~/stores/splitView'
import { useContextMenuStore } from '~/stores/contextMenu'

const splitViewStore = useSplitViewStore()
const contextMenuStore = useContextMenuStore()

interface User {
  avatar: string
  displayName: string
  username: string
  instance?: string // e.g. 'misskey.io'
}

interface PostProps {
  post: {
    id: string
    author: User
    createdAt: Date | string
    content: string
    replyTo?: {
      author: User
    }
    metrics: {
      replies: number
      reposts: number
      reactions: number
    }
  }
  isDetailView?: boolean
}

const props = defineProps<PostProps>()

// 相对时间：如“1小时前”
const relativeTime = computed(() => {
  return formatDistanceToNowStrict(new Date(props.post.createdAt), {
    addSuffix: true,
    locale: zhCN
  })
})

// 联邦用户名逻辑: 如果是联邦实例发布的，在"用户名"后加上"@（联邦实例域名）"
const fullUsername = computed(() => {
  const base = `@${props.post.author.username}`
  return props.post.author.instance ? `${base}@${props.post.author.instance}` : base
})

function handleClick() {
  if (!props.isDetailView) {
    splitViewStore.openPost(props.post)
  }
}

function handleUserClick(e: MouseEvent) {
  e.stopPropagation()
  if (!props.isDetailView) {
    splitViewStore.openUser(props.post.author)
  }
}
</script>

<template>
  <article
    :class="[
      'flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800/60 transition-colors animate-[fade-in_0.3s_ease-out]',
      isDetailView ? '' : 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
    ]"
    @click="handleClick"
    @contextmenu.stop="contextMenuStore.open($event, 'post', post)"
  >
    <!-- 左侧 头像 -->
    <div class="shrink-0 pt-1">
      <UAvatar
        :src="post.author.avatar"
        :alt="post.author.displayName"
        size="md"
        class="ring-2 ring-transparent hover:ring-cyan-400 transition-all cursor-pointer shadow-sm"
        @click="handleUserClick"
      />
    </div>

    <!-- 右侧 内容区 -->
    <div class="flex-1 min-w-0 flex flex-col gap-1.5">
      <!-- 头部 Header (名字、实例、时间) -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-start flex-col gap-0.5 min-w-0">
          <div class="flex items-center gap-1.5 truncate w-full">
            <span
              class="font-bold text-[15px] truncate cursor-pointer hover:underline text-gray-900 dark:text-gray-100 decoration-cyan-400"
              @click="handleUserClick"
            >
              {{ post.author.displayName }}
            </span>
            <span class="text-sm text-gray-500 truncate cursor-pointer hover:text-cyan-600 transition-colors">
              {{ fullUsername }}
            </span>
          </div>

          <!-- 联邦实例 Badge (如果在下方显示) -->
          <div
            v-if="post.author.instance"
            class="flex items-center"
          >
            <span class="text-[11px] font-medium bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-100 dark:border-cyan-800/50 flex items-center gap-1">
              <UIcon
                name="i-material-symbols-public"
                class="w-3 h-3"
              />
              {{ post.author.instance }}
            </span>
          </div>
        </div>

        <!-- 相对时间 -->
        <NuxtLink
          :to="`/post/${post.id}`"
          class="text-sm text-gray-400 hover:underline shrink-0 tabular-nums self-start pt-0.5"
        >
          {{ relativeTime }}
        </NuxtLink>
      </div>

      <!-- 回复上下文提示 -->
      <div
        v-if="post.replyTo"
        class="flex items-center gap-1 text-[13px] text-gray-500 mb-0.5 mt-0.5"
      >
        <UIcon
          name="i-material-symbols-subdirectory-arrow-right"
          class="w-4 h-4 text-cyan-500 bg-cyan-50 dark:bg-cyan-900/40 rounded p-0.5"
        />
        <span class="flex items-center gap-1">
          回复了
          <span class="font-medium text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline flex items-center gap-1">
            <UAvatar
              :src="post.replyTo.author.avatar"
              size="3xs"
            />
            {{ post.replyTo.author.displayName }}
          </span>
          的帖子
        </span>
      </div>

      <!-- 帖子内容主体 (集成 MFM) -->
      <div class="text-[15px] leading-relaxed break-words text-gray-800 dark:text-gray-200">
        <MfmRenderer :text="post.content" />
      </div>

      <!-- 底部操作按钮 Action Buttons -->
      <div class="flex items-center gap-4 mt-2 -ml-2 text-gray-500">
        <!-- 回复 (Reply) -->
        <UButton
          icon="i-material-symbols-chat-bubble"
          :label="post.metrics.replies ? String(post.metrics.replies) : ''"
          color="neutral"
          variant="ghost"
          size="sm"
          class="hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-all rounded-full px-2.5"
        />
        <!-- 转帖 (Repost) -->
        <UButton
          icon="i-material-symbols-repeat"
          :label="post.metrics.reposts ? String(post.metrics.reposts) : ''"
          color="neutral"
          variant="ghost"
          size="sm"
          class="hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/50 transition-all rounded-full px-2.5"
        />
        <!-- 表情回应 (Reaction) -->
        <UButton
          icon="i-material-symbols-add"
          :label="post.metrics.reactions ? String(post.metrics.reactions) : ''"
          color="neutral"
          variant="ghost"
          size="sm"
          class="hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all rounded-full px-2.5"
        />
        <!-- 更多 (More) -->
        <UButton
          icon="i-material-symbols-more-horiz"
          color="neutral"
          variant="ghost"
          size="sm"
          class="hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-all rounded-full px-2.5 ml-auto"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
