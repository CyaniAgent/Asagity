import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSystemStore = defineStore('system', () => {
  const isBackendOnline = ref(true)
  const isFrontendOnlyMode = ref(false)
  const showConnectionErrorModal = ref(false)
  const heartbeatInterval = ref<any>(null)

  // Triggered when an API call fails due to severe network issues
  function triggerOfflineFallback() {
    if (isBackendOnline.value) {
      isBackendOnline.value = false
      showConnectionErrorModal.value = true
    }
  }

  // Triggered when the user dismisses the error modal
  function enableFrontendOnlyMode() {
    showConnectionErrorModal.value = false
    isFrontendOnlyMode.value = true
  }

  // Restore normal operations
  function restoreOnlineMode() {
    if (!isBackendOnline.value) {
      isBackendOnline.value = true
      isFrontendOnlyMode.value = false
      showConnectionErrorModal.value = false
      
      if (process.client) {
         const toast = useAppToast()
         toast.add({
           title: '连接已恢复 (ONLINE)',
           description: '感知到服务端在线，系统功能已全面回复。',
           color: 'success',
           icon: 'i-material-symbols-cloud-done-rounded'
         })
      }
    }
  }

  // The Heartbeat Engine
  async function checkBackendHealth() {
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
    showConnectionErrorModal,
    triggerOfflineFallback,
    enableFrontendOnlyMode,
    restoreOnlineMode,
    startHeartbeat,
    stopHeartbeat
  }
})
