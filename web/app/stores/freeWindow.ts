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

interface OpenContextData {
  post?: Post | null
  user?: User | null
  chat?: Chat | null
}

interface OpenContextTabs {
  activeTab?: string
  profileTab?: string
}

type ViewType = 'post' | 'user' | 'music' | 'notifications' | 'chat' | 'admin_database'

export const useFreeWindowStore = defineStore('freeWindow', () => {
  const isOpen = ref(false)
  const currentPost = ref<Post | null>(null)
  const currentUser = ref<User | null>(null)
  const currentChat = ref<Chat | null>(null)

  const activeTab = ref('comments')
  const profileTab = ref('home')

  const currentViewType = ref<ViewType | null>(null)
  const isMaximized = ref(false)
  const isMinimized = ref(false)
  const refreshKey = ref(0)

  const position = ref({ x: window?.innerWidth ? window.innerWidth / 2 - 200 : 100, y: 100 })

  function openFromContext(type: ViewType, data: OpenContextData, tabs: OpenContextTabs) {
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
