import { defineStore } from 'pinia'
import { ref, computed, onBeforeUnmount } from 'vue'
import { parseBlob } from 'music-metadata'
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
  text: string // Combined text for display
  rawLines: string[] // Original lines for this timestamp
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
    url: '/sounds/MusicTest.mp3'
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
      // Fetch the file and parse as a blob with the new music-metadata library
      const response = await fetch(url)
      const blob = await response.blob()
      const metadata = await parseBlob(blob)

      let albumArt = 'https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg'
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0]
        if (pic) {
          const uint8Array = new Uint8Array(pic.data)
          const blob = new Blob([uint8Array], { type: pic.format })
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
        if (lyric && lyric.text) {
          parseLyrics(lyric.text)
        }
      } else {
        // Fallback or clear
        lyrics.value = []
      }

      if (audio) {
        audio.src = url
      }
    } catch (error) {
      console.error('Final music loading error:', error)
    } finally {
      isLoading.value = false
    }
  }

  function parseLyrics(lrcContent: string) {
    try {
      const parsed = Lrc.parse(lrcContent)
      const grouped: Record<number, string[]> = {}

      parsed.lyrics.forEach((line) => {
        const ts = line.timestamp
        if (!grouped[ts]) {
          grouped[ts] = []
        }
        grouped[ts].push(line.content)
      })

      lyrics.value = Object.entries(grouped)
        .map(([timestamp, lines]) => ({
          timestamp: parseFloat(timestamp),
          text: lines.join('\n'),
          rawLines: lines
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
    } catch {
      console.warn('LRC parsing failed, treating as plain text')
      lyrics.value = [{ timestamp: 0, text: lrcContent, rawLines: [lrcContent] }]
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
