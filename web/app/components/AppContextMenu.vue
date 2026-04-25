<script setup lang="ts">
import { useContextMenuStore } from '~/stores/contextMenu'
import { useUserStore } from '~/stores/user'
import { useFreeWindowStore } from '~/stores/freeWindow'
import { useSplitViewStore } from '~/stores/splitView'

const contextMenuStore = useContextMenuStore()
const userStore = useUserStore()
const freeWindowStore = useFreeWindowStore()
const splitViewStore = useSplitViewStore()
const toast = useAppToast()

const menuRef = ref<HTMLElement | null>(null)

// 点击外部关闭
onClickOutside(menuRef, () => {
  contextMenuStore.close()
})

// 监听滚动或缩放时关闭
onMounted(() => {
  window.addEventListener('scroll', contextMenuStore.close, true)
  window.addEventListener('resize', contextMenuStore.close)
})

onUnmounted(() => {
  window.removeEventListener('scroll', contextMenuStore.close, true)
  window.removeEventListener('resize', contextMenuStore.close)
})

const handleAction = (action: () => void) => {
  action()
  contextMenuStore.close()
}

// 功能实现
const refresh = () => window.location.reload()
const sharePage = () => {
  if (navigator.share) {
    navigator.share({ title: 'Asagity', url: window.location.href })
  } else {
    navigator.clipboard.writeText(window.location.href)
    toast.add({ title: '链接已复制 (COPIED)', color: 'success' })
  }
}

const copyContent = (content: string) => {
  navigator.clipboard.writeText(content)
  toast.add({ title: '内容已复制 (COPIED)', color: 'success' })
}

const copyPubID = (pubid: string) => {
  navigator.clipboard.writeText(pubid)
  toast.add({ title: 'PubID 已复制', color: 'success' })
}

const openFederated = (post: any) => {
  if (post.author.instance) {
    // 假设联邦实例的链接逻辑，这里只是演示
    const url = `https://${post.author.instance}/@${post.author.username}/${post.id}`
    window.open(url, '_blank')
  }
}

const openExternal = (url: string) => {
  window.open(url, '_blank')
}

const openInternal = (path: string) => {
  const router = useRouter()
  router.push(path)
}

const deletePost = (post: any) => {
  const isSelf = post.author.username === userStore.username
  const canAdmin = userStore.isAdmin || userStore.isModerator

  const actionName = canAdmin && !isSelf ? '删帖 (ADMIN DELETE)' : '删除 (DELETE)'

  toast.add({
    title: `${actionName} 成功`,
    description: '帖子已从矩阵中移除。',
    color: 'success',
    icon: 'i-material-symbols-delete-outline'
  })
}

// 选中文字逻辑 (Selection Logic)
const selectedText = ref('')
watch(() => contextMenuStore.isOpen, (open) => {
  if (open) {
    selectedText.value = window.getSelection()?.toString().trim() || ''
  }
})

const shareSelectedText = () => {
  if (navigator.share && selectedText.value) {
    navigator.share({ text: selectedText.value })
  } else {
    copyContent(selectedText.value)
  }
}

// 计算位置以防超出屏幕
const menuStyle = computed(() => {
  if (!menuRef.value) return { left: `${contextMenuStore.x}px`, top: `${contextMenuStore.y}px` }

  const { innerWidth, innerHeight } = window
  const menuWidth = 220
  const menuHeight = contextMenuStore.type === 'post' ? 450 : 150

  let left = contextMenuStore.x
  let top = contextMenuStore.y

  if (left + menuWidth > innerWidth) left = innerWidth - menuWidth - 10
  if (top + menuHeight > innerHeight) top = innerHeight - menuHeight - 10

  return {
    left: `${left}px`,
    top: `${top}px`
  }
})
</script>

<template>
  <Transition name="menu-fade">
    <div v-if="contextMenuStore.isOpen" :key="contextMenuStore.menuKey" ref="menuRef"
      class="fixed z-[9999] w-[220px] bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden p-1.5"
      :style="menuStyle" @contextmenu.prevent>
      <!-- 选中文字菜单 (Text Selection) -->
      <template v-if="selectedText">
        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-500/10"
            @click="handleAction(() => copyContent(selectedText))">
            <UIcon name="i-material-symbols-content-copy-rounded" class="w-4 h-4 opacity-70" />
            <span>复制</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(shareSelectedText)">
            <UIcon name="i-material-symbols-share-outline" class="w-4 h-4 opacity-70" />
            <span>分享选中文字</span>
          </button>
        </div>
        <div class="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />
      </template>

      <!-- 帖子特定菜单 -->
      <template v-if="contextMenuStore.type === 'post'">
        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-500/10"
            @click="handleAction(() => splitViewStore.openPost(contextMenuStore.data))">
            <UIcon name="i-material-symbols-visibility-outline" class="w-4 h-4 opacity-70" />
            <span>详情</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => copyContent(contextMenuStore.data.content))">
            <UIcon name="i-material-symbols-content-copy-outline" class="w-4 h-4 opacity-70" />
            <span>复制内容</span>
          </button>
          <button v-if="contextMenuStore.data.author.instance"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => openFederated(contextMenuStore.data))">
            <UIcon name="i-material-symbols-language" class="w-4 h-4 opacity-70" />
            <span class="text-xs">转到联邦实例打开</span>
          </button>
        </div>

        <div class="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />

        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => { })">
            <UIcon name="i-material-symbols-share-outline" class="w-4 h-4 opacity-70" />
            <span>分享</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => { })">
            <UIcon name="i-material-symbols-favorite-outline" class="w-4 h-4 opacity-70" />
            <span>收藏</span>
          </button>
        </div>

        <div class="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />
      </template>

      <!-- 内部链接菜单 (Internal Link) -->
      <template v-if="contextMenuStore.type === 'link_internal'">
        <div class="px-3 py-2 mb-1 flex flex-col gap-0.5 overflow-hidden">
          <span class="text-[10px] font-black text-cyan-500 uppercase tracking-widest opacity-60">Internal Path</span>
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">{{ contextMenuStore.data.path
          }}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-500/10"
            @click="handleAction(() => openInternal(contextMenuStore.data.path))">
            <UIcon name="i-material-symbols-open-in-new" class="w-4 h-4 opacity-70" />
            <span>打开</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => copyContent(contextMenuStore.data.href))">
            <UIcon name="i-material-symbols-link" class="w-4 h-4 opacity-70" />
            <span>复制链接</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(refresh)">
            <UIcon name="i-material-symbols-refresh" class="w-4 h-4 opacity-70" />
            <span>刷新</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(sharePage)">
            <UIcon name="i-material-symbols-ios-share" class="w-4 h-4 opacity-70" />
            <span>分享该页面</span>
          </button>
        </div>

        <div class="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />

        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => splitViewStore.openBrowser(contextMenuStore.data.href))">
            <UIcon name="i-material-symbols-vertical-split" class="w-4 h-4 opacity-70" />
            <span>在拆分视图打开</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => freeWindowStore.openBrowser(contextMenuStore.data.href))">
            <UIcon name="i-material-symbols-open-in-new" class="w-4 h-4 opacity-70" />
            <span>在自由窗口打开</span>
          </button>
        </div>
      </template>

      <!-- 外部链接菜单 (External Link) -->
      <template v-if="contextMenuStore.type === 'link_external'">
        <div class="px-3 py-2 mb-1 flex flex-col gap-0.5 overflow-hidden">
          <span class="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest opacity-60">{{
            contextMenuStore.data.title }}</span>
          <span class="text-[9px] font-bold text-gray-400 truncate">{{ contextMenuStore.data.url }}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-fuchsia-600 dark:text-fuchsia-400 font-bold hover:bg-fuchsia-500/10"
            @click="handleAction(() => openExternal(contextMenuStore.data.url))">
            <UIcon name="i-material-symbols-open-in-new" class="w-4 h-4 opacity-70" />
            <span>在新标签页打开</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => splitViewStore.openBrowser(contextMenuStore.data.url))">
            <UIcon name="i-material-symbols-laptop-mac-outline" class="w-4 h-4 opacity-70" />
            <span>在内部浏览器打开</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => splitViewStore.openBrowser(contextMenuStore.data.url))">
            <UIcon name="i-material-symbols-vertical-split" class="w-4 h-4 opacity-70" />
            <span>在拆分视图打开</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => freeWindowStore.openBrowser(contextMenuStore.data.url))">
            <UIcon name="i-material-symbols-open-in-new" class="w-4 h-4 opacity-70" />
            <span>在自由窗口打开</span>
          </button>
        </div>

        <div class="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />

        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => copyContent(contextMenuStore.data.url))">
            <UIcon name="i-material-symbols-link" class="w-4 h-4 opacity-70" />
            <span>复制链接</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => { })">
            <UIcon name="i-material-symbols-ios-share" class="w-4 h-4 opacity-70" />
            <span>分享链接</span>
          </button>
        </div>
      </template>

      <!-- 全局常用菜单 -->
      <div v-if="contextMenuStore.type === 'global'" class="flex flex-col gap-0.5">
        <button
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
          @click="handleAction(refresh)">
          <UIcon name="i-material-symbols-refresh" class="w-4 h-4 opacity-70" />
          <span>刷新</span>
        </button>
        <button
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
          @click="handleAction(() => freeWindowStore.openFromContext('post', { post: contextMenuStore.data }, {}))">
          <UIcon name="i-material-symbols-open-in-new" class="w-4 h-4 opacity-70" />
          <span>在自由窗口打开</span>
        </button>
        <button
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
          @click="handleAction(sharePage)">
          <UIcon name="i-material-symbols-ios-share" class="w-4 h-4 opacity-70" />
          <span>分享页面</span>
        </button>
      </div>

      <!-- 帖子管理菜单 -->
      <template v-if="contextMenuStore.type === 'post'">
        <div class="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />
        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            @click="handleAction(() => { })">
            <UIcon name="i-material-symbols-tag" class="w-4 h-4 opacity-70" />
            <span>添加到话题...</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
            @click="handleAction(() => { })">
            <UIcon name="i-material-symbols-block" class="w-4 h-4 opacity-70" />
            <span>屏蔽此主题串</span>
          </button>
        </div>

        <div class="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />

        <div class="flex flex-col gap-0.5">
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-red-600 dark:text-red-400 hover:bg-red-500/10"
            @click="handleAction(() => deletePost(contextMenuStore.data))">
            <UIcon name="i-material-symbols-delete-outline" class="w-4 h-4 opacity-70" />
            <span>{{ (userStore.isAdmin || userStore.isModerator) && contextMenuStore.data.author.username !==
              userStore.username ? '删帖' : '删除' }}</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-red-600 dark:text-red-400 hover:bg-red-500/10"
            @click="handleAction(() => { })">
            <UIcon name="i-material-symbols-report-outline" class="w-4 h-4 opacity-70" />
            <span>举报</span>
          </button>
          <button
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            @click="handleAction(() => copyPubID(contextMenuStore.data.author.pubid || 'asgt_unknown'))">
            <UIcon name="i-material-symbols-fingerprint" class="w-4 h-4 opacity-70" />
            <span class="text-[10px]">复制 PubID</span>
          </button>
        </div>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
