import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSplitViewStore = defineStore('splitView', () => {
  const isOpen = ref(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPost = ref<any>(null)
  const activeTab = ref('comments')

  function openPost(post: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    currentPost.value = post
    isOpen.value = true
    activeTab.value = 'comments'
  }

  function close() {
    isOpen.value = false
    setTimeout(() => {
      currentPost.value = null
    }, 300) // Clear after animation
  }

  function setTab(tab: string) {
    activeTab.value = tab
  }

  return {
    isOpen,
    currentPost,
    activeTab,
    openPost,
    close,
    setTab
  }
})
