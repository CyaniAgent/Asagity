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

  const soundRegistry = {
    ca: '/sounds/YunaAyase/ca.wav',
    sys_error: '/sounds/YunaAyase/sys_error.wav',
    sys_net_restored: '/sounds/YunaAyase/sys_net_restored.wav',
    message_sent: '/sounds/Defaults/MessageSent.ogg',
    message_received: '/sounds/Defaults/MessageReceived.ogg'
  }

  async function getAudioContext(): Promise<AudioContext> {
    if (!audioContext.value) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContext.value = new AudioCtx()
    }
    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
    }
    return audioContext.value
  }

  async function loadSound(name: string, url: string): Promise<AudioBuffer | null> {
    if (soundCache.value[name]) {
      return soundCache.value[name]
    }

    try {
      const ctx = await getAudioContext()
      const response = await fetch(url)
      if (!response.ok) {
        console.warn(`SoundManager: Failed to fetch ${url}, status=${response.status}`)
        return null
      }
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      soundCache.value[name] = audioBuffer
      return audioBuffer
    } catch (err) {
      console.warn(`SoundManager: Failed to load sound ${name}:`, err)
      return null
    }
  }

  async function preloadSounds(exclude: string[] = []): Promise<void> {
    if (isPreloaded.value || isPreloading.value) return
    isPreloading.value = true

    const preloadPromises = Object.entries(soundRegistry)
      .filter(([name]) => !exclude.includes(name))
      .map(async ([name, url]) => {
        await loadSound(name, url)
      })

    await Promise.allSettled(preloadPromises)

    isPreloaded.value = true
    isPreloading.value = false
    console.log(`SoundManager: Sounds preloaded (excluded: ${exclude.join(', ') || 'none'})`)
  }

  async function play(name: string): Promise<void> {
    const buffer = soundCache.value[name] || await loadSound(name, soundRegistry[name as keyof typeof soundRegistry])
    if (!buffer) {
      console.warn(`SoundManager: Cannot play ${name} - not loaded`)
      return
    }

    const ctx = await getAudioContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  }

  function playIfAvailable(name: string): void {
    play(name).catch(err => console.warn(`SoundManager: Play error for ${name}:`, err))
  }

  return {
    soundRegistry,
    isPreloaded,
    isPreloading,
    preloadSounds,
    play,
    playIfAvailable,
    getAudioContext,
    loadSound
  }
})
