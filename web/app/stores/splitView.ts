import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Post {
  id: string
  author: {
    avatar: string
    displayName: string
    username: string
    instance?: string
  }
  createdAt: Date | string
  content: string
  metrics: {
    replies: number
    reposts: number
    reactions: number
  }
}

interface User {
  avatar: string
  displayName: string
  username: string
  instance?: string
  banner?: string
  isVerified?: boolean
  bio?: string
  location?: string
  birthday?: string
  joinedAt?: string
  stats?: {
    posts: number
    following: number
    followers: number
  }
}

interface Chat {
  id: string | number
  name: string
  avatar: string
  lastMessage?: string
  unreadCount?: number
  online?: boolean
  isGroup?: boolean
  members?: number
}

type RightViewType = 'post' | 'user' | 'music' | 'notifications' | 'chat' | 'browser'

export const useSplitViewStore = defineStore('splitView', () => {
  const isOpen = ref(false)
  const currentPost = ref<Post | null>(null)
  const currentUser = ref<User | null>(null)
  const currentChat = ref<Chat | null>(null)
  const activeTab = ref('comments')
  const profileTab = ref('home')
  const rightPanelWidth = ref(50)
  const isResizing = ref(false)
  const activeView = ref<'left' | 'right' | 'widgets'>('left')
  const currentRightViewType = ref<RightViewType | null>(null)
  const currentBrowserUrl = ref('')

  const isMaximized = ref(false)
  const refreshKey = ref(0)

  const widgetsPanelWidth = ref(320)
  const isWidgetsResizing = ref(false)

  function openPost(post: Post) {
    currentPost.value = post
    currentUser.value = null
    currentChat.value = null
    currentRightViewType.value = 'post'
    isOpen.value = true
    activeTab.value = 'comments'
    activeView.value = 'right'
    isMaximized.value = false
    rightPanelWidth.value = 50
  }

  function openUser(user: User) {
    currentUser.value = user
    currentPost.value = null
    currentChat.value = null
    currentRightViewType.value = 'user'
    isOpen.value = true
    profileTab.value = 'home'
    activeView.value = 'right'
    isMaximized.value = false
    rightPanelWidth.value = 50
  }

  function openChat(chat: Chat) {
    currentChat.value = chat
    currentPost.value = null
    currentUser.value = null
    currentRightViewType.value = 'chat'
    isOpen.value = true
    activeView.value = 'right'
    isMaximized.value = false
    rightPanelWidth.value = 45
  }

  function openMusic() {
    currentPost.value = null
    currentUser.value = null
    currentChat.value = null
    currentRightViewType.value = 'music'
    isOpen.value = true
    activeView.value = 'right'
    isMaximized.value = false
    rightPanelWidth.value = 38
  }

  function openBrowser(url: string) {
    currentBrowserUrl.value = url
    currentPost.value = null
    currentUser.value = null
    currentChat.value = null
    currentRightViewType.value = 'browser'
    isOpen.value = true
    activeView.value = 'right'
    isMaximized.value = false
    rightPanelWidth.value = 60
  }

  function openNotifications() {
    currentPost.value = null
    currentUser.value = null
    currentChat.value = null
    currentRightViewType.value = 'notifications'
    isOpen.value = true
    activeView.value = 'right'
    isMaximized.value = false
    rightPanelWidth.value = 40
  }

  function close() {
    isOpen.value = false
    activeView.value = 'left'
    currentRightViewType.value = null
    isMaximized.value = false
    setTimeout(() => {
      currentPost.value = null
      currentUser.value = null
    }, 300)
  }

  function toggleMaximize() {
    isMaximized.value = !isMaximized.value
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

  function setRightPanelWidth(width: number) {
    if (isMaximized.value) return
    rightPanelWidth.value = Math.max(20, Math.min(80, width))
  }

  function focusLeft() {
    activeView.value = 'left'
  }

  function focusRight() {
    activeView.value = 'right'
  }

  function focusWidgets() {
    activeView.value = 'widgets'
  }

  function setWidgetsPanelWidth(width: number) {
    widgetsPanelWidth.value = Math.max(240, Math.min(480, width))
  }

  return {
    isOpen,
    currentPost,
    currentUser,
    currentChat,
    currentBrowserUrl,
    activeTab,
    profileTab,
    rightPanelWidth,
    isResizing,
    activeView,
    currentRightViewType,
    isMaximized,
    refreshKey,
    widgetsPanelWidth,
    isWidgetsResizing,
    openPost,
    openUser,
    openMusic,
    openNotifications,
    openChat,
    openBrowser,
    close,
    toggleMaximize,
    triggerRefresh,
    setTab,
    setProfileTab,
    setRightPanelWidth,
    focusLeft,
    focusRight,
    focusWidgets,
    setWidgetsPanelWidth
  }
})
