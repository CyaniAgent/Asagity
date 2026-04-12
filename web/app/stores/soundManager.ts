import { defineStore } from 'pinia'
import { ref } from 'vue'

interface SoundCache {
  [key: string]: AudioBuffer | null
}

export const useSoundManager = defineStore('soundManager', () => {
  const audioContext = ref<AudioContext | null>(null)
  const soundCache = ref<SoundCache>({})
  const isPreloaded = ref(false)
  const isPreloading = ref(false)
  const dbReady = ref(false)

  // Sound registry - add new sounds here
  const soundRegistry = {
    ca: '/sounds/YunaAyase/ca.wav',
    sys_error: '/sounds/YunaAyase/sys_error.wav',
    sys_net_restored: '/sounds/YunaAyase/sys_net_restored.wav'
  }

  // IndexedDB for persistent caching
  let db: IDBDatabase | null = null

  async function initDB(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open('AsagitySounds', 1)

      request.onerror = () => {
        console.warn('SoundManager: IndexedDB not available, using memory cache')
        resolve()
      }

      request.onsuccess = () => {
        db = request.result
        dbReady.value = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains('sounds')) {
          database.createObjectStore('sounds', { keyPath: 'name' })
        }
      }
    })
  }

  async function getCachedSound(name: string): Promise<AudioBuffer | null> {
    if (!db) return null

    return new Promise((resolve) => {
      const transaction = db!.transaction(['sounds'], 'readonly')
      const store = transaction.objectStore('sounds')
      const request = store.get(name)

      request.onsuccess = () => {
        resolve(request.result?.buffer || null)
      }

      request.onerror = () => {
        resolve(null)
      }
    })
  }

  async function cacheSound(name: string, buffer: AudioBuffer): Promise<void> {
    if (!db) return

    return new Promise((resolve) => {
      const transaction = db!.transaction(['sounds'], 'readwrite')
      const store = transaction.objectStore('sounds')
      const request = store.put({ name, buffer: buffer as unknown as null })

      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
    })
  }

  async function loadSound(name: string, url: string): Promise<AudioBuffer | null> {
    // Check cache first
    const cached = await getCachedSound(name)
    if (cached) {
      soundCache.value[name] = cached
      return cached
    }

    // Fetch and decode
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch ${url}`)

      const arrayBuffer = await response.arrayBuffer()

      if (!audioContext.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        audioContext.value = new AudioCtx()
      }

      const audioBuffer = await audioContext.value.decodeAudioData(arrayBuffer)

      // Cache it
      soundCache.value[name] = audioBuffer
      await cacheSound(name, audioBuffer)

      return audioBuffer
    } catch (err) {
      console.warn(`SoundManager: Failed to load sound ${name}:`, err)
      return null
    }
  }

  async function preloadSounds(): Promise<void> {
    if (isPreloaded.value || isPreloading.value) return
    isPreloading.value = true

    // Initialize DB
    await initDB()

    // Preload all registered sounds
    const preloadPromises = Object.entries(soundRegistry).map(async ([name, url]) => {
      await loadSound(name, url)
    })

    await Promise.allSettled(preloadPromises)

    isPreloaded.value = true
    isPreloading.value = false
    console.log('SoundManager: All sounds preloaded')
  }

  function play(name: string): void {
    const buffer = soundCache.value[name]
    if (!buffer || !audioContext.value) {
      console.warn(`SoundManager: Cannot play ${name} - not loaded`)
      return
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }

    const source = audioContext.value.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.value.destination)
    source.start(0)
  }

  function playIfAvailable(name: string): void {
    if (soundCache.value[name]) {
      play(name)
    }
  }

  return {
    soundRegistry,
    isPreloaded,
    isPreloading,
    preloadSounds,
    play,
    playIfAvailable
  }
})
