import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSplitViewStore = defineStore('splitView', () => {
  const isOpen = ref(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPost = ref<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = ref<any>(null)
  const activeTab = ref('comments')
  const profileTab = ref('home')
  const rightPanelWidth = ref(50) // Percentage
  const isResizing = ref(false)
  const activeView = ref<'left' | 'right'>('left')
  const currentRightViewType = ref<'post' | 'user' | 'music' | 'notifications' | null>(null)

  function openPost(post: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    currentPost.value = post
    currentUser.value = null
    currentRightViewType.value = 'post'
    isOpen.value = true
    activeTab.value = 'comments'
    activeView.value = 'right'
  }

  function openUser(user: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    currentUser.value = user
    currentPost.value = null
    currentRightViewType.value = 'user'
    isOpen.value = true
    profileTab.value = 'home'
    activeView.value = 'right'
  }

  function openMusic() {
    currentPost.value = null
    currentUser.value = null
    currentRightViewType.value = 'music'
    isOpen.value = true
    activeView.value = 'right'
  }

  function openNotifications() {
    currentPost.value = null
    currentUser.value = null
    currentRightViewType.value = 'notifications'
    isOpen.value = true
    activeView.value = 'right'
  }

  function close() {
    isOpen.value = false
    activeView.value = 'left'
    currentRightViewType.value = null
    setTimeout(() => {
      currentPost.value = null
      currentUser.value = null
    }, 300)
  }

  function setTab(tab: string) {
    activeTab.value = tab
  }

  function setProfileTab(tab: string) {
    profileTab.value = tab
  }

  function setRightPanelWidth(width: number) {
    rightPanelWidth.value = Math.max(20, Math.min(80, width))
  }

  function focusLeft() {
    activeView.value = 'left'
  }

  function focusRight() {
    activeView.value = 'right'
  }

  return {
    isOpen,
    currentPost,
    currentUser,
    activeTab,
    profileTab,
    rightPanelWidth,
    isResizing,
    activeView,
    currentRightViewType,
    openPost,
    openUser,
    openMusic,
    openNotifications,
    close,
    setTab,
    setProfileTab,
    setRightPanelWidth,
    focusLeft,
    focusRight
  }
})
