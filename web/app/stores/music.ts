import { defineStore } from 'pinia'
import { ref, computed, onBeforeUnmount } from 'vue'
import { fetchFromUrl } from 'music-metadata-browser'
import { Lrc } from 'lrc-kit'

export interface Track {
  id: string
  title: string
  artist: string
  albumArt: string
  duration: number // in seconds
  url: string
}

export interface LyricLine {
  timestamp: number
  text: string
}

export const useMusicStore = defineStore('music', () => {
  const isPlaying = ref(false)
  const progress = ref(0) // seconds
  const volume = ref(70)
  const lyrics = ref<LyricLine[]>([])
  const currentLyricIndex = ref(-1)
  const isLoading = ref(false)

  const currentTrack = ref<Track>({
    id: '1',
    title: 'Loading...',
    artist: 'Loading...',
    albumArt: 'https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg',
    duration: 0,
    url: 'https://kodo.imikufans.com//iMikufansHub/1d73728b-f240-4d0f-8add-d158ddc52be8.flac'
  })

  // HTML5 Audio handle (Client-side only)
  let audio: HTMLAudioElement | null = null

  if (import.meta.client) {
    audio = new Audio()
    audio.volume = volume.value / 100

    audio.addEventListener('timeupdate', () => {
      if (audio) {
        progress.value = audio.currentTime
        updateLyricIndex()
      }
    })

    audio.addEventListener('play', () => {
      isPlaying.value = true
    })
    audio.addEventListener('pause', () => {
      isPlaying.value = false
    })
    audio.addEventListener('ended', () => {
      isPlaying.value = false
    })
  }

  const progressPercentage = computed(() => {
    if (!currentTrack.value.duration) return 0
    return (progress.value / currentTrack.value.duration) * 100
  })

  async function fetchMetadata(url: string) {
    isLoading.value = true
    try {
      // Use fetchFromUrl for browser-side metadata extraction
      const metadata = await fetchFromUrl(url)

      let albumArt = 'https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg'
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0]
        if (pic) {
          const blob = new Blob([pic.data], { type: pic.format })
          albumArt = URL.createObjectURL(blob)
        }
      }

      currentTrack.value = {
        id: url,
        title: metadata.common.title || 'Unknown Title',
        artist: metadata.common.artist || 'Unknown Artist',
        albumArt,
        duration: metadata.format.duration || 0,
        url
      }

      // Check for lyrics in metadata
      if (metadata.common.lyrics && metadata.common.lyrics.length > 0) {
        const lyric = metadata.common.lyrics[0]
        if (lyric) {
          parseLyrics(lyric)
        }
      } else {
        lyrics.value = []
      }

      if (audio) {
        audio.src = url
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    } finally {
      isLoading.value = false
    }
  }

  function parseLyrics(lrcContent: string) {
    try {
      const parsed = Lrc.parse(lrcContent)
      lyrics.value = parsed.lyrics.map(line => ({
        timestamp: line.timestamp,
        text: line.content
      }))
    } catch {
      console.warn('LRC parsing failed, treating as plain text')
      lyrics.value = [{ timestamp: 0, text: lrcContent }]
    }
  }

  function updateLyricIndex() {
    if (lyrics.value.length === 0) return
    const time = progress.value
    const index = lyrics.value.findIndex((line, i) => {
      const nextLine = lyrics.value[i + 1]
      return time >= line.timestamp && (!nextLine || time < nextLine.timestamp)
    })
    currentLyricIndex.value = index
  }

  function togglePlay() {
    if (!audio) return
    if (isPlaying.value) {
      audio.pause()
    } else {
      audio.play().catch(console.error)
    }
  }

  function setProgress(value: number) {
    if (!audio) return
    audio.currentTime = value
    progress.value = value
  }

  function setVolume(value: number) {
    volume.value = value
    if (audio) {
      audio.volume = value / 100
    }
  }

  // Initial load
  if (import.meta.client) {
    fetchMetadata(currentTrack.value.url)
  }

  onBeforeUnmount(() => {
    if (audio) {
      audio.pause()
      audio.src = ''
      audio = null
    }
  })

  return {
    isPlaying,
    progress,
    volume,
    currentTrack,
    lyrics,
    currentLyricIndex,
    isLoading,
    progressPercentage,
    togglePlay,
    setProgress,
    setVolume,
    fetchMetadata
  }
})
