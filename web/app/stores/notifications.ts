import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'mention' | 'reblog' | 'quote' | 'reaction' | 'follow' | 'poll' | 'tip' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  createdAt: string
  isRead: boolean
  user?: {
    id: string
    name: string
    username: string
    avatar: string
  }
  post?: {
    id: string
    content: string
  }
  content?: string // For tips or system messages
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([
    {
      id: '1',
      type: 'mention',
      createdAt: new Date().toISOString(),
      isRead: false,
      user: {
        id: 'user1',
        name: ' 初音ミク',
        username: 'miku',
        avatar: 'https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg'
      },
      post: {
        id: 'post1',
        content: 'Producer-san, @user 今天的练习也要加油哦！( •̀ ω •́ )✧'
      }
    },
    {
      id: '2',
      type: 'tip',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
      content: '收到来自 镜音リン 的 39 积分打赏！'
    },
    {
      id: '3',
      type: 'system',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isRead: true,
      content: '欢迎来到 Asagity！次元之门已经为您开启。'
    }
  ])

  function markAsRead(id: string) {
    const notify = notifications.value.find(n => n.id === id)
    if (notify) notify.isRead = true
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.isRead = true)
  }

  return {
    notifications,
    markAsRead,
    markAllAsRead
  }
})
