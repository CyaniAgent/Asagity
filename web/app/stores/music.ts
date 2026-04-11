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
  bitrate?: number
  sampleRate?: number
  container?: string
  codec?: string
  year?: number
  album?: string
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

  // New Playback States
  const shuffle = ref(false)
  const loopMode = ref<'none' | 'one' | 'all'>('none')

  const defaultPlaylist: Track[] = [
    { id: 'track-0', title: 'MusicTest0', artist: 'Local Track', albumArt: '', duration: 0, url: '/sounds/MusicTest0.mp3' },
    { id: 'track-1', title: 'MusicTest1', artist: 'Local Track', albumArt: '', duration: 0, url: '/sounds/MusicTest1.mp3' },
    { id: 'track-2', title: 'MusicTest2', artist: 'Local Track', albumArt: '', duration: 0, url: '/sounds/MusicTest2.mp3' }
  ]

  const playlist = ref<Track[]>(defaultPlaylist)
  const currentIndex = ref(0)

  // UI States
  const isLyricsWindowOpen = ref(false)
  const isMusicInfoWindowOpen = ref(false)
  const isPlaylistWindowOpen = ref(false)
  const themeColor = ref('#39C5BB')
  const textColor = ref('#FFFFFF')

  const currentTrack = ref<Track>({
    id: 'loading',
    title: 'Loading...',
    artist: 'Loading...',
    albumArt: 'https://images.microcms-assets.io/assets/2665b63c437a44f4a35048d2eb4b7b3b/0cc8e4b8a9f34a41b7cc1d83049b4c05/tell-your-world.jpg',
    duration: 0,
    url: '/sounds/MusicTest0.mp3' // Default to first track
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
      playNext(true) // Trigger auto-next
    })
  }

  function seek(timeInSeconds: number) {
    if (audio) {
      audio.currentTime = timeInSeconds
      progress.value = timeInSeconds
      updateLyricIndex()
    }
  }

  const progressPercentage = computed(() => {
    if (!currentTrack.value.duration) return 0
    return (progress.value / currentTrack.value.duration) * 100
  })

  const audioQuality = computed(() => {
    const { container, bitrate } = currentTrack.value
    if (!container) return 'Unknown'

    const c = container.toUpperCase()
    const isLossless = ['FLAC', 'WAV', 'ALAC', 'AIFF', 'MONKEY\'S AUDIO'].includes(c)
    if (isLossless) return 'Lossless'

    if (c === 'MPEG' || c === 'ADTS' || c === 'M4A' || c === 'MP4') {
      if (!bitrate) return 'Unknown'
      const kbps = bitrate / 1000
      if (kbps <= 128) return 'MP3 Normal'
      return 'MP3 HQ'
    }

    return container
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
        url,
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        container: metadata.format.container,
        codec: metadata.format.codec,
        year: metadata.common.year,
        album: metadata.common.album
      }

      // Extract colors from cover
      if (import.meta.client) {
        await extractColor(albumArt)
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

  async function extractColor(imageSrc: string) {
    if (!import.meta.client) return

    return new Promise<void>((resolve) => {
      const img = new Image()
      // For blobs or same-origin, this is fine
      img.src = imageSrc

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve()

        // Downsample to get average color
        canvas.width = 10
        canvas.height = 10
        ctx.drawImage(img, 0, 0, 10, 10)

        const data = ctx.getImageData(0, 0, 10, 10).data
        let r = 0, g = 0, b = 0

        for (let i = 0; i < data.length; i += 4) {
          r += data[i] ?? 0
          g += (data[i + 1] ?? 0)
          b += (data[i + 2] ?? 0)
        }

        const count = data.length / 4
        r = Math.floor(r / count)
        g = Math.floor(g / count)
        b = Math.floor(b / count)

        themeColor.value = `rgb(${r}, ${g}, ${b})`

        // Relative luminance: 0.2126*R + 0.7152*G + 0.0722*B
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b)
        // If brightness > 140, use black text for better contrast
        textColor.value = luminance > 140 ? '#000000' : '#FFFFFF'

        resolve()
      }

      img.onerror = () => resolve()
    })
  }

  // Playback Control Logic
  function toggleShuffle() {
    shuffle.value = !shuffle.value
  }

  function toggleLoopMode() {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all']
    const nextIdx = (modes.indexOf(loopMode.value) + 1) % modes.length
    loopMode.value = modes[nextIdx] as ('none' | 'one' | 'all')
  }

  async function playNext(isAuto = false) {
    if (loopMode.value === 'one' && isAuto) {
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(console.error)
      }
      return
    }

    if (playlist.value.length === 0) return

    let nextIdx = currentIndex.value
    if (shuffle.value) {
      // Pick a random index that isn't the current one (if playlist > 1)
      if (playlist.value.length > 1) {
        do {
          nextIdx = Math.floor(Math.random() * playlist.value.length)
        } while (nextIdx === currentIndex.value)
      }
    } else {
      nextIdx = currentIndex.value + 1
      if (nextIdx >= playlist.value.length) {
        if (loopMode.value === 'all') {
          nextIdx = 0
        } else {
          // End of playlist
          isPlaying.value = false
          return
        }
      }
    }

    await setTrackByIndex(nextIdx)
  }

  async function playPrev() {
    if (playlist.value.length === 0) return

    let prevIdx = currentIndex.value - 1
    if (prevIdx < 0) {
      prevIdx = loopMode.value === 'all' ? playlist.value.length - 1 : 0
    }

    await setTrackByIndex(prevIdx)
  }

  async function setTrackByIndex(index: number) {
    if (index < 0 || index >= playlist.value.length) return
    currentIndex.value = index
    const track = playlist.value[index]
    if (!track) return
    await fetchMetadata(track.url)
    if (audio) {
      audio.play().catch(console.error)
    }
  }

  async function setPlaylist(tracks: Track[], startIndex = 0) {
    playlist.value = tracks
    await setTrackByIndex(startIndex)
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
    shuffle,
    loopMode,
    playlist,
    currentIndex,
    isLyricsWindowOpen,
    isMusicInfoWindowOpen,
    isPlaylistWindowOpen,
    themeColor,

    textColor,
    audioQuality,
    seek,
    togglePlay,
    setProgress,
    setVolume,
    fetchMetadata,
    toggleShuffle,
    toggleLoopMode,
    playNext,
    playPrev,
    setTrackByIndex,
    setPlaylist
  }
})
