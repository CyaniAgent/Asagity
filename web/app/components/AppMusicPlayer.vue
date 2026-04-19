<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '~/stores/music'
import { useSplitViewStore } from '~/stores/splitView'
import MusicLyrics from '~/components/MusicLyrics.vue'

const musicStore = useMusicStore()
const splitViewStore = useSplitViewStore()

const activeColor = computed(() => musicStore.themeColor)
const textColor = computed(() => musicStore.textColor)

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(400)
const showLyricsMode = ref(false)

const isNarrow = computed(() => containerWidth.value < 380)

const coverSize = computed(() => {
  if (containerWidth.value < 300) return Math.min(containerWidth.value - 32, 240)
  if (containerWidth.value < 400) return 280
  return 340
})

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleProgressChange(e: Event) {
  const target = e.target as HTMLInputElement
  musicStore.setProgress(parseFloat(target.value))
}

function toggleLyricsMode() {
  showLyricsMode.value = !showLyricsMode.value
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex flex-col h-full overflow-hidden font-sans select-none transition-colors duration-1000"
    :style="{ color: textColor }"
  >
    <!-- Immersive Blurred Backdrop -->
    <div
      class="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000"
      :style="{ backgroundColor: musicStore.themeColor }"
    >
      <img
        :src="musicStore.currentTrack.albumArt"
        class="w-full h-full object-cover scale-150 blur-[100px] opacity-60 transition-all duration-1000"
        alt=""
      >
      <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
    </div>

    <!-- Absolute Navigation Header -->
    <header
      class="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 pointer-events-auto shrink-0"
    >
      <div class="flex items-center gap-2">
        <div
          class="w-6 h-6 rounded-full bg-gray-900/5 dark:bg-white/10 backdrop-blur-md flex items-center justify-center"
        >
          <UIcon
            name="i-material-symbols-music-note"
            class="text-cyan-500 w-3 h-3"
          />
        </div>
        <span
          class="text-[9px] font-black uppercase tracking-[0.15em] opacity-40"
          :class="isNarrow && 'hidden'"
        >
          Now Playing
        </span>
      </div>
      <button
        class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90"
        :style="{ color: textColor }"
        @click="splitViewStore.close()"
      >
        <UIcon
          name="i-material-symbols-close"
          class="w-4 h-4"
        />
      </button>
    </header>

    <!-- Core Content: All fixed, no scroll -->
    <div class="relative z-10 flex flex-col h-full pt-14 pb-4 px-4">
      <!-- Loading Overlay -->
      <div
        v-if="musicStore.isLoading"
        class="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-40 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-4">
          <UIcon
            name="i-material-symbols-progress-activity"
            class="w-10 h-10 text-cyan-500 animate-spin"
          />
          <p class="text-[10px] font-black tracking-[0.15em] text-gray-900/50 dark:text-white/70">
            Loading...
          </p>
        </div>
      </div>

      <!-- Album Art / Lyrics Toggle Area -->
      <div
        class="flex-1 flex items-center justify-center overflow-hidden"
        :class="isNarrow ? 'min-h-0' : ''"
      >
        <Transition :name="showLyricsMode ? 'slide-left' : 'slide-right'">
          <div
            v-if="!showLyricsMode"
            key="cover"
            class="relative shrink-0 overflow-hidden shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)]"
            :class="isNarrow ? 'rounded-2xl' : 'rounded-[28px]'"
            :style="{ width: `${coverSize}px`, height: `${coverSize}px` }"
          >
            <img
              :src="musicStore.currentTrack.albumArt"
              class="w-full h-full object-cover"
              alt="Album Art"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-black/40 to-transparent" />
          </div>
          <div
            v-else
            key="lyrics"
            class="relative shrink-0 overflow-hidden"
            :class="isNarrow ? 'rounded-2xl' : 'rounded-[28px]'"
            :style="{ width: `${coverSize}px`, height: `${coverSize}px` }"
          >
            <MusicLyrics />
          </div>
        </Transition>
      </div>

      <!-- Bottom Fixed Controls -->
      <div class="shrink-0">
        <!-- Track Info -->
        <div
          class="text-center mb-3"
          :class="isNarrow ? 'px-2' : ''"
        >
          <h1
            class="font-black tracking-tight leading-tight truncate"
            :class="isNarrow ? 'text-base' : 'text-xl'"
            :style="{ color: textColor }"
          >
            {{ musicStore.currentTrack.title }}
          </h1>
          <p
            class="font-bold truncate opacity-60"
            :class="isNarrow ? 'text-xs mt-0.5' : 'text-sm mt-1'"
          >
            {{ musicStore.currentTrack.artist || 'Unknown Artist' }}
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="w-full mb-3 space-y-1.5">
          <div class="relative w-full h-1.5 bg-gray-900/5 dark:bg-white/10 rounded-full group cursor-pointer">
            <input
              type="range"
              :min="0"
              :max="musicStore.currentTrack.duration || 100"
              :value="musicStore.progress"
              step="0.1"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              @input="handleProgressChange"
            >
            <div
              class="absolute top-0 left-0 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(57,197,187,0.5)]"
              :style="{ width: `${musicStore.progressPercentage}%`, backgroundColor: activeColor }"
            />
            <div
              class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              :style="{ left: `${musicStore.progressPercentage}%` }"
            />
          </div>
          <div class="flex justify-between text-[10px] font-black tracking-widest font-mono opacity-40">
            <span :style="{ color: textColor }">{{ formatTime(musicStore.progress) }}</span>
            <span :style="{ color: textColor }">{{ formatTime(musicStore.currentTrack.duration) }}</span>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="w-full flex items-center justify-between">
          <!-- Left: Shuffle -->
          <div class="w-11 h-11 flex items-center justify-center">
            <UButton
              :icon="musicStore.shuffle ? 'i-material-symbols-shuffle' : 'i-material-symbols-shuffle'"
              variant="ghost"
              :color="musicStore.shuffle ? 'primary' : 'neutral'"
              :class="[
                'transition-all duration-300',
                musicStore.shuffle ? 'text-cyan-500 drop-shadow-[0_0_8px_rgba(57,197,187,0.3)]' : 'text-gray-900/20 dark:text-white/30 hover:text-gray-900 dark:hover:text-white'
              ]"
              size="md"
              @click="musicStore.toggleShuffle"
            />
          </div>

          <!-- Center: Prev, Play, Next -->
          <div class="flex items-center gap-2">
            <UButton
              icon="i-material-symbols-skip-previous"
              variant="ghost"
              color="neutral"
              size="lg"
              class="text-gray-900 dark:text-white hover:scale-110 active:scale-90"
              @click="musicStore.playPrev"
            />
            <button
              class="rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
              :class="isNarrow ? 'w-14 h-14' : 'w-16 h-16'"
              :style="{ backgroundColor: textColor, color: musicStore.themeColor }"
              @click="musicStore.togglePlay"
            >
              <UIcon
                :name="musicStore.isPlaying ? 'i-material-symbols-pause' : 'i-material-symbols-play-arrow'"
                :class="[
                  isNarrow ? 'w-7 h-7' : 'w-8 h-8',
                  !musicStore.isPlaying && 'translate-x-0.5'
                ]"
              />
            </button>
            <UButton
              icon="i-material-symbols-skip-next"
              variant="ghost"
              color="neutral"
              size="lg"
              class="text-gray-900 dark:text-white hover:scale-110 active:scale-90"
              @click="musicStore.playNext(false)"
            />
          </div>

          <!-- Right: Loop & Playlist -->
          <div class="w-11 h-11 flex items-center justify-center gap-0.5">
            <UButton
              :icon="musicStore.loopMode === 'one' ? 'i-material-symbols-repeat-one' : 'i-material-symbols-repeat'"
              variant="ghost"
              :color="musicStore.loopMode !== 'none' ? 'primary' : 'neutral'"
              :class="[
                'transition-all duration-300',
                musicStore.loopMode !== 'none' ? 'text-cyan-500 drop-shadow-[0_0_8px_rgba(57,197,187,0.3)]' : 'text-gray-900/20 dark:text-white/30 hover:text-gray-900 dark:hover:text-white'
              ]"
              size="md"
              @click="musicStore.toggleLoopMode"
            />
            <UButton
              icon="i-material-symbols-queue-music"
              variant="ghost"
              :color="musicStore.isPlaylistWindowOpen ? 'primary' : 'neutral'"
              :class="[
                'transition-all duration-300',
                musicStore.isPlaylistWindowOpen ? 'text-cyan-500 drop-shadow-[0_0_8px_rgba(57,197,187,0.3)]' : 'text-gray-900/20 dark:text-white/30 hover:text-gray-900 dark:hover:text-white'
              ]"
              size="md"
              @click="musicStore.isPlaylistWindowOpen = !musicStore.isPlaylistWindowOpen"
            />
          </div>
        </div>

        <!-- Secondary Toolbar -->
        <div class="w-full flex justify-between items-center mt-3">
          <h3
            class="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase"
            :style="{ color: textColor, opacity: 0.4 }"
          >
            <span
              class="w-1.5 h-1.5 rounded-full animate-pulse"
              :style="{ backgroundColor: textColor }"
            />
            Immersion Lyrics
          </h3>
          <div class="flex items-center gap-1">
            <UButton
              :icon="showLyricsMode ? 'i-material-symbols-album' : 'i-material-symbols-lyrics'"
              variant="ghost"
              color="neutral"
              size="sm"
              class="rounded-full hover:bg-white/10 transition-all active:scale-90"
              :style="{ color: textColor, opacity: 0.4 }"
              @click="toggleLyricsMode"
            />
            <UButton
              icon="i-material-symbols-picture-in-picture-alt"
              variant="ghost"
              color="neutral"
              size="sm"
              class="rounded-full hover:bg-white/10 transition-all active:scale-90"
              :style="{ color: textColor, opacity: 0.4 }"
              @click="musicStore.isLyricsWindowOpen = true"
            />
            <UButton
              icon="i-material-symbols-share"
              variant="ghost"
              color="neutral"
              size="sm"
              class="rounded-full hover:bg-white/10 transition-all active:scale-90"
              :style="{ color: textColor, opacity: 0.4 }"
            />
            <UButton
              icon="i-material-symbols-tune"
              variant="ghost"
              color="neutral"
              size="sm"
              class="rounded-full hover:bg-white/10 transition-all active:scale-90"
              :style="{ color: textColor, opacity: 0.4 }"
            />
            <UButton
              icon="i-material-symbols-info"
              variant="ghost"
              color="neutral"
              size="sm"
              class="rounded-full hover:bg-white/10 transition-all active:scale-90"
              :style="{ color: textColor, opacity: 0.4 }"
              @click="musicStore.isMusicInfoWindowOpen = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Windows -->
    <MusicLyricsWindow />
    <MusicInfoWindow />
    <MusicPlaylistWindow />
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s ease-out;
  position: absolute;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 0;
  width: 0;
}
</style>
