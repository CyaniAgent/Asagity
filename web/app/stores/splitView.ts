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

type RightViewType = 'post' | 'user' | 'music' | 'notifications' | 'chat'

export const useSplitViewStore = defineStore('splitView', () => {
  const isOpen = ref(false)
  const currentPost = ref<Post | null>(null)
  const currentUser = ref<User | null>(null)
  const currentChat = ref<Chat | null>(null)
  const activeTab = ref('comments')
  const profileTab = ref('home')
  const rightPanelWidth = ref(50)
  const isResizing = ref(false)
  const activeView = ref<'left' | 'right'>('left')
  const currentRightViewType = ref<RightViewType | null>(null)

  const isMaximized = ref(false)
  const refreshKey = ref(0)

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

  return {
    isOpen,
    currentPost,
    currentUser,
    currentChat,
    activeTab,
    profileTab,
    rightPanelWidth,
    isResizing,
    activeView,
    currentRightViewType,
    isMaximized,
    refreshKey,
    openPost,
    openUser,
    openMusic,
    openNotifications,
    openChat,
    close,
    toggleMaximize,
    triggerRefresh,
    setTab,
    setProfileTab,
    setRightPanelWidth,
    focusLeft,
    focusRight
  }
})
