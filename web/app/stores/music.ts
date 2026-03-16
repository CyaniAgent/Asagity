import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Track {
  id: string
  title: string
  artist: string
  albumArt: string
  duration: number // in seconds
}

export const useMusicStore = defineStore('music', () => {
  const isPlaying = ref(false)
  const progress = ref(0) // seconds
  const volume = ref(70)
  const currentTrack = ref<Track>({
    id: '1',
    title: 'Tell Your World',
    artist: 'kz(livetune) feat. 初音ミク',
    albumArt: 'https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg',
    duration: 257
  })

  const progressPercentage = computed(() => {
    return (progress.value / currentTrack.value.duration) * 100
  })

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function setProgress(value: number) {
    progress.value = Math.max(0, Math.min(value, currentTrack.value.duration))
  }

  function setVolume(value: number) {
    volume.value = Math.max(0, Math.min(value, 100))
  }

  return {
    isPlaying,
    progress,
    volume,
    currentTrack,
    progressPercentage,
    togglePlay,
    setProgress,
    setVolume
  }
})
