import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFreeWindowStore = defineStore('freeWindow', () => {
  const isOpen = ref(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPost = ref<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = ref<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentChat = ref<any>(null)

  const activeTab = ref('comments')
  const profileTab = ref('home')

  const currentViewType = ref<'post' | 'user' | 'music' | 'notifications' | 'chat' | 'admin_database' | null>(null)
  const isMaximized = ref(false)
  const isMinimized = ref(false)
  const refreshKey = ref(0)

  // Position constraints for Draggable
  const position = ref({ x: window?.innerWidth ? window.innerWidth / 2 - 200 : 100, y: 100 })

  function openFromContext(type: any, data: any, tabs: any) {
    currentViewType.value = type
    currentPost.value = data.post || null
    currentUser.value = data.user || null
    currentChat.value = data.chat || null
    activeTab.value = tabs.activeTab || 'comments'
    profileTab.value = tabs.profileTab || 'home'

    isMinimized.value = false
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    isMaximized.value = false
    isMinimized.value = false
    setTimeout(() => {
      currentViewType.value = null
      currentPost.value = null
      currentUser.value = null
      currentChat.value = null
    }, 300)
  }

  function toggleMaximize() {
    isMaximized.value = !isMaximized.value
    if (isMaximized.value) isMinimized.value = false
  }

  function toggleMinimize() {
    isMinimized.value = !isMinimized.value
    if (isMinimized.value) isMaximized.value = false
  }

  function triggerRefresh() {
    refreshKey.value++
  }

  function setTab(tab: string) {
    activeTab.value = tab
  }

  function setProfileTab(tab: string) {
    profileTab.value = tab
  }

  return {
    isOpen,
    currentPost,
    currentUser,
    currentChat,
    activeTab,
    profileTab,
    currentViewType,
    isMaximized,
    isMinimized,
    refreshKey,
    position,
    openFromContext,
    close,
    toggleMaximize,
    toggleMinimize,
    triggerRefresh,
    setTab,
    setProfileTab
  }
})
