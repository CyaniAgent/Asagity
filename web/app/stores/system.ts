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

interface FetchError {
  name?: string
  message?: string
}

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

  async function initSequence() {
    if (isInitialized.value) return

    isInitialized.value = true
    initProgress.value = 100

    fetchHostInfoWithTimeout().catch(() => {})

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
    } catch (err: unknown) {
      const fetchError = err as FetchError
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('abort')) {
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

  function launchApp() {
    if (!isInitialized.value) return

    if (import.meta.client) {
      const AudioCtx = (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      if (AudioCtx) {
        const audioCtx = new AudioCtx()
        if (audioCtx.state === 'suspended') {
          audioCtx.resume()
        }
      }

      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
      silentAudio.play().catch(() => {})
    }

    hasLaunched.value = true
    startHeartbeat()
  }

  function triggerOfflineFallback() {
    if (isBackendOnline.value && !isDevMode.value) {
      isBackendOnline.value = false
      showConnectionErrorModal.value = true
    }
  }

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

  function enableFrontendOnlyMode() {
    showConnectionErrorModal.value = false
    isFrontendOnlyMode.value = true
  }

  function restoreOnlineMode() {
    if (!isBackendOnline.value || isDevMode.value) {
      isBackendOnline.value = true
      isFrontendOnlyMode.value = false
      showConnectionErrorModal.value = false

      isDevMode.value = false

      if (import.meta.client) {
        const toast = useAppToast()
        toast.add({
          title: '连接已恢复 (ONLINE)',
          description: '感知到服务端在线，系统功能已全面回复。',
          color: 'success',
          icon: 'i-material-symbols-cloud-done-rounded',
          silent: !hasLaunched.value,
          persist: false
        })
      }
    }
  }

  async function checkBackendHealth() {
    try {
      await $fetch('/healthz', {
        method: 'GET',
        timeout: 2000,
        headers: { 'Cache-Control': 'no-cache' }
      })

      restoreOnlineMode()
    } catch {
      if (!isDevMode.value) {
        triggerOfflineFallback()
      }
    }
  }

  function startHeartbeat() {
    if (heartbeatInterval.value) return

    checkBackendHealth()

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
