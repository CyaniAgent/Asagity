import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HostInfo {
  hostname: string
  platform: string
  arch: string
  cpu: string
  node_version: string
  startup_time: number
  uptime_seconds: number
  docker: boolean
}

export const ERROR_CODE_INIT_FAILED = 'ERR 12201'
export const ERROR_CODE_NETWORK_TIMEOUT = 'ERR 12202'

export const useSystemStore = defineStore('system', () => {
  const isBackendOnline = ref(true)
  const isFrontendOnlyMode = ref(false)
  const showConnectionErrorModal = ref(false)
  const isDevMode = ref(false)
  const isInitialized = ref(false)
  const hasLaunched = ref(false)
  const initError = ref<string | null>(null)
  const initErrorCode = ref<string | null>(null)
  const initProgress = ref(0)
  const heartbeatInterval = ref<ReturnType<typeof setInterval> | null>(null)

  const hostInfo = ref<HostInfo | null>(null)

  // Initialization Sequence
  async function initSequence() {
    if (isInitialized.value) return

    isInitialized.value = true
    initProgress.value = 100

    // Non-blocking: fetch host info in background
    fetchHostInfoWithTimeout().catch(() => {})

    // Always launch immediately - backend status shown via heartbeat/modal
    launchApp()
  }

  async function fetchHostInfoWithTimeout(): Promise<void> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const data = await $fetch<HostInfo>('/api/system/environment', {
        signal: controller.signal
      })
      hostInfo.value = data
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        console.warn('Host info fetch timeout, continuing without it')
      } else {
        console.warn('Failed to fetch host info:', err)
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async function fetchHostInfo() {
    try {
      const data = await $fetch<HostInfo>('/api/system/environment')
      hostInfo.value = data
    } catch (err) {
      console.warn('Failed to fetch host info:', err)
    }
  }

  // Launch the application (Triggered by user gesture)
  function launchApp() {
    if (!isInitialized.value) return

    // Unlock Audio Context for modern browsers
    if (import.meta.client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
      if (AudioCtx) {
        const audioCtx = new AudioCtx()
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

    if (import.meta.client) {
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

      if (import.meta.client) {
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
    } catch {
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
    initErrorCode,
    initProgress,
    initSequence,
    launchApp,
    triggerOfflineFallback,
    enableDevMode,
    enableFrontendOnlyMode,
    restoreOnlineMode,
    startHeartbeat,
    stopHeartbeat,
    hostInfo,
    fetchHostInfo,
    fetchHostInfoWithTimeout,
    ERROR_CODE_INIT_FAILED,
    ERROR_CODE_NETWORK_TIMEOUT
  }
})
