import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSystemStore = defineStore('system', () => {
  const isBackendOnline = ref(true)
  const isFrontendOnlyMode = ref(false)
  const showConnectionErrorModal = ref(false)
  const isDevMode = ref(false)
  const heartbeatInterval = ref<any>(null)

  // Triggered when an API call fails due to severe network issues
  function triggerOfflineFallback() {
    if (isBackendOnline.value && !isDevMode.value) {
      isBackendOnline.value = false
      showConnectionErrorModal.value = true
    }
  }

  // Developer Mode (Mock Backend Mode)
  function enableDevMode() {
    isDevMode.value = true
    isBackendOnline.value = true
    showConnectionErrorModal.value = false
    
    if (process.client) {
      const toast = useAppToast()
      toast.add({
        title: '已进入开发模式',
        description: '该模式仅供开发时使用，刷新即可退出。',
        color: 'warning',
        icon: 'i-material-symbols-terminal-rounded'
      })
    }
  }

  // Triggered when the user dismisses the error modal
  function enableFrontendOnlyMode() {
    showConnectionErrorModal.value = false
    isFrontendOnlyMode.value = true
  }

  // Restore normal operations
  function restoreOnlineMode() {
    if (!isBackendOnline.value || isDevMode.value) {
      isBackendOnline.value = true
      isFrontendOnlyMode.value = false
      showConnectionErrorModal.value = false
      
      // If we were in dev mode, we stay in dev mode until refresh
      // but if the backend actually comes back, we can just be normal
      isDevMode.value = false 

      if (process.client) {
         const toast = useAppToast()
         toast.add({
           title: '连接已恢复 (ONLINE)',
           description: '感知到服务端在线，系统功能已全面回复。',
           color: 'success',
           icon: 'i-material-symbols-cloud-done-rounded',
           silent: true,
           persist: false
         })
      }
    }
  }

  // The Heartbeat Engine
  async function checkBackendHealth() {
    if (isDevMode.value) return // Don't check if in dev mode

    try {
      await $fetch('/healthz', {
        method: 'GET',
        timeout: 2000,
        headers: { 'Cache-Control': 'no-cache' }
      })

      restoreOnlineMode()
    } catch (err) {
      triggerOfflineFallback()
    }
  }

  function startHeartbeat() {
    if (heartbeatInterval.value) return
    
    // Initial check
    checkBackendHealth()
    
    // Regular polling every 5 seconds
    heartbeatInterval.value = setInterval(() => {
      checkBackendHealth()
    }, 5000)
  }

  function stopHeartbeat() {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  return {
    isBackendOnline,
    isFrontendOnlyMode,
    isDevMode,
    showConnectionErrorModal,
    triggerOfflineFallback,
    enableDevMode,
    enableFrontendOnlyMode,
    restoreOnlineMode,
    startHeartbeat,
    stopHeartbeat
  }
})
