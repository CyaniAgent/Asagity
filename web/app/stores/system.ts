import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSystemStore = defineStore('system', () => {
  const isBackendOnline = ref(true)
  const isFrontendOnlyMode = ref(false)
  const showConnectionErrorModal = ref(false)
  const isDevMode = ref(false)
  const isInitialized = ref(false)
  const hasLaunched = ref(false)
  const initError = ref<string | null>(null)
  const initProgress = ref(0)
  const heartbeatInterval = ref<any>(null)

  // Initialization Sequence
  async function initSequence() {
    if (isInitialized.value && !initError.value) return
    
    // Reset state for potential retry
    initError.value = null
    initProgress.value = 0
    isInitialized.value = false

    try {
      // Step 1: Internal Client Preparation (Non-network)
      initProgress.value = 20
      
      // Step 2: Pre-load Essential Assets (Sounds, etc) - STRICT MODE
      initProgress.value = 50
      if (process.client) {
        const assetsToLoad = [
          '/sounds/YunaAyase/ca.wav',
          '/sounds/YunaAyase/sys_error.wav',
          '/sounds/YunaAyase/sys_net_restored.wav'
        ]
        
        await Promise.all(assetsToLoad.map(url => {
          return new Promise((resolve, reject) => {
            const audio = new Audio()
            audio.addEventListener('canplaythrough', () => {
              console.log(`Asset loaded: ${url}`)
              resolve(true)
            }, { once: true })
            audio.addEventListener('error', () => {
              reject(new Error(`Failed to load essential sound: ${url}`))
            }, { once: true })
            audio.src = url
            audio.load()
            
            // Timeout safety for the promise
            setTimeout(() => reject(new Error(`Loading timed out for: ${url}`)), 10000)
          })
        }))
      }
      
      // Step 3: Local Database / Metadata Readiness
      initProgress.value = 80
      
      // Finalizing
      setTimeout(() => {
        initProgress.value = 100
        isInitialized.value = true
        
        // AUTO-ENTRY: Automatically call launchApp after initialization
        // This will start the heartbeat ONLY after client is fully ready
        launchApp()
      }, 500)

    } catch (err: any) {
      console.error('Asagity Initialization Failed:', err)
      initError.value = err.message || 'Unknown initialization error'
      initProgress.value = 0
    }
  }

  // Launch the application (Triggered by user gesture)
  function launchApp() {
    if (!isInitialized.value) return
    
    // Unlock Audio Context for modern browsers
    if (process.client) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        const audioCtx = new AudioContext()
        if (audioCtx.state === 'suspended') {
          audioCtx.resume()
        }
      }
      
      // Play a tiny silent sound to further ensure the context is "warm"
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
      silentAudio.play().catch(() => {})
    }

    hasLaunched.value = true
    startHeartbeat()
  }

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
           silent: !hasLaunched.value, // Don't play sound if not launched
           persist: false
         })
      }
    }
  }

  // The Heartbeat Engine
  async function checkBackendHealth() {
    // We now allow health checks even in Dev Mode to support "Auto-Exit" 
    // when the real backend comes back online.

    try {
      await $fetch('/healthz', {
        method: 'GET',
        timeout: 2000,
        headers: { 'Cache-Control': 'no-cache' }
      })

      // If we were in Dev Mode and the check succeeds, restoreOnlineMode 
      // will set isDevMode to false and play the restoration sound.
      restoreOnlineMode()
    } catch (err) {
      // If we are in Dev Mode, don't trigger offline fallback
      if (!isDevMode.value) {
        triggerOfflineFallback()
      }
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
    isInitialized,
    hasLaunched,
    initError,
    initProgress,
    initSequence,
    launchApp,
    triggerOfflineFallback,
    enableDevMode,
    enableFrontendOnlyMode,
    restoreOnlineMode,
    startHeartbeat,
    stopHeartbeat
  }
})
