import { defineStore } from 'pinia'
import { ref } from 'vue'
import { UAParser } from 'ua-parser-js'

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
export const ERROR_CODE_CONNECTION_FAILED = 'ERR 11500'
export const ERROR_CODE_UNKNOWN = 'ERR 9999'

interface FetchError {
  name?: string
  message?: string
}

export const useSystemStore = defineStore('system', () => {
  const isBackendOnline = ref(true)
  const isFrontendOnlyMode = ref(false)
  const isDevMode = ref(false)
  const isInitialized = ref(false)
  const hasLaunched = ref(false)
  const isFirstCheck = ref(true)
  const isLoadFinished = ref(false)
  const isWelcomeDismissed = ref(false)
  const isMobile = ref(false)
  const initError = ref<string | null>(null)
  const initErrorCode = ref<string | null>(null)
  const initProgress = ref(0)
  const heartbeatInterval = ref<ReturnType<typeof setInterval> | null>(null)

  const hostInfo = ref<HostInfo | null>(null)

  async function initSequence() {
    if (isInitialized.value) return

    isInitialized.value = true
    initProgress.value = 100

    // BUG FIX: Preload/Initialize haptics in the init sequence for mobile readiness
    if (import.meta.client) {
      const { initHaptics } = await import('~/utils/haptics')
      initHaptics()

      const parser = new UAParser(navigator.userAgent)
      const device = parser.getDevice()
      isMobile.value = device.type === 'mobile' || device.type === 'tablet'
    }

    fetchHostInfoWithTimeout().catch(() => { })

    isLoadFinished.value = true

    // BUG FIX: Delay launch and heartbeat if we need to show mobile welcome
    if (!isMobile.value || isWelcomeDismissed.value) {
      launchApp()
    }
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
      // BUG FIX: Use soundManager to ensure global AudioContext is resumed/unlocked
      const soundManager = useSoundManager()
      soundManager.getAudioContext().catch((e: Error) => console.warn('AudioContext resume failed:', e))

      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
      silentAudio.play().catch(() => { })
    }

    hasLaunched.value = true
    startHeartbeat()
  }

  function triggerOfflineFallback() {
    if (isBackendOnline.value && !isDevMode.value) {
      isBackendOnline.value = false

      const freeWindowStore = useFreeWindowStore()
      freeWindowStore.openError(
        '无法连接到服务端',
        '本实例无法连接到服务端，目前无法享受主要的在线服务。已自动进入"仅前端模式"。请稍后刷新重试或联系实例管理员。',
        ERROR_CODE_CONNECTION_FAILED,
        isFirstCheck.value // SILENT ON FIRST CHECK
      )

      // BUG FIX: Automatically enter frontend-only mode when error pops up
      enableFrontendOnlyMode()

      isFirstCheck.value = false
    }
  }

  function enableDevMode() {
    isDevMode.value = true
    isBackendOnline.value = true

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
    isFrontendOnlyMode.value = true
  }

  function restoreOnlineMode() {
    if (!isBackendOnline.value || isDevMode.value) {
      isBackendOnline.value = true
      isFrontendOnlyMode.value = false

      const freeWindowStore = useFreeWindowStore()
      if (freeWindowStore.currentViewType === 'error') {
        freeWindowStore.close()
      }

      isDevMode.value = false
      isFirstCheck.value = false

      // Plan B: Preload the error sound now that we are online, for future use
      if (import.meta.client) {
        const soundManager = useSoundManager()
        soundManager.loadSound('sys_error', soundManager.soundRegistry.sys_error).catch(() => { })
      }

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
    isInitialized,
    isLoadFinished,
    hasLaunched,
    isMobile,
    isWelcomeDismissed,
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
