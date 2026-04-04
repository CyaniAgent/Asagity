<script setup lang="ts">
import { computed } from 'vue'
import { useMusicStore } from '~/stores/music'
import { useSplitViewStore } from '~/stores/splitView'
import { useSystemStore } from '~/stores/system'
import MusicLyrics from '~/components/MusicLyrics.vue'

const musicStore = useMusicStore()
const splitViewStore = useSplitViewStore()
const systemStore = useSystemStore()

// Dynamic theme color from album art
const activeColor = computed(() => musicStore.themeColor)
const textColor = computed(() => musicStore.textColor)

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleProgressChange(e: Event) {
  const target = e.target as HTMLInputElement
  musicStore.setProgress(parseFloat(target.value))
}

function handleVolumeChange(e: Event) {
  const target = e.target as HTMLInputElement
  musicStore.setVolume(parseInt(target.value))
}
</script>

<template>
  <div 
    class="relative flex flex-col h-full overflow-hidden font-sans select-none transition-colors duration-1000"
    :style="{ color: textColor }"
  >
    <!-- Immersive Blurred Backdrop -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000" :style="{ backgroundColor: musicStore.themeColor }">
      <img
        :src="musicStore.currentTrack.albumArt"
        class="w-full h-full object-cover scale-150 blur-[100px] opacity-60 transition-all duration-1000"
        alt=""
      >
      <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
    </div>

    <!-- Absolute Navigation Header -->
    <header class="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-50 pointer-events-auto">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-900/5 dark:bg-white/10 backdrop-blur-md flex items-center justify-center">
          <UIcon
            name="i-material-symbols-music-note"
            class="text-cyan-500 w-4 h-4"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Now Playing</span>
        </div>
      </div>
      <UButton
        icon="i-material-symbols-close"
        color="neutral"
        variant="ghost"
        class="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90"
        :style="{ color: textColor }"
        @click="splitViewStore.close()"
      />
    </header>

    <!-- Main Scrollable Content -->
    <div class="relative z-10 flex-1 overflow-y-auto custom-scrollbar pt-24 pb-12 px-6 flex flex-col items-center">
      <!-- Loading Overlay -->
      <div
        v-if="musicStore.isLoading"
        class="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-40 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-6">
          <UIcon
            name="i-material-symbols-progress-activity"
            class="w-12 h-12 text-cyan-500 animate-spin"
          />
          <p class="text-xs font-black tracking-[0.2em] text-gray-900/50 dark:text-white/70">
            Asagity rendering...
          </p>
        </div>
      </div>

      <!-- Large Center Piece: Album Art -->
      <section class="w-full max-w-[320px] aspect-square relative mb-10 group shrink-0">
        <div
          class="absolute inset-0 bg-cyan-500/20 rounded-[40px] blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
          :style="{ backgroundColor: `${activeColor}33` }"
        />
        <div class="relative w-full h-full rounded-[40px] overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] transition-transform duration-700 ease-out group-hover:scale-[1.02]">
          <img
            :src="musicStore.currentTrack.albumArt"
            class="w-full h-full object-cover transition-all duration-700"
            alt="Album Art"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-black/40 to-transparent" />
        </div>
      </section>

      <!-- Track Information -->
      <section class="w-full max-w-[340px] mb-8 space-y-1 text-center md:text-left">
        <h1 class="text-2xl md:text-3xl font-black tracking-tight leading-tight truncate" :style="{ color: textColor }">
          {{ musicStore.currentTrack.title }}
        </h1>
        <p class="text-lg font-bold truncate flex items-center justify-center md:justify-start gap-2 opacity-60">
          <span>{{ musicStore.currentTrack.artist || 'Unknown Artist' }}</span>
          <span class="w-1 h-1 rounded-full" :style="{ backgroundColor: textColor }" />
          <span class="text-sm">Hi-res</span>
        </p>
      </section>

      <!-- Interactive Seeker & Time -->
      <section class="w-full max-w-[360px] mb-8 space-y-3">
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
          <!-- Thumb visualization -->
          <div
            class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            :style="{ left: `${musicStore.progressPercentage}%` }"
          />
        </div>
        <div class="flex justify-between text-[10px] font-black tracking-widest font-mono opacity-40">
          <span :style="{ color: textColor }">{{ formatTime(musicStore.progress) }}</span>
          <span :style="{ color: textColor }">{{ formatTime(musicStore.currentTrack.duration) }}</span>
        </div>
      </section>

      <!-- Playback Controls -->
      <section class="w-full max-w-[360px] flex items-center justify-around mb-12">
        <UButton
          :icon="musicStore.shuffle ? 'i-material-symbols-shuffle' : 'i-material-symbols-shuffle'"
          variant="ghost"
          :color="musicStore.shuffle ? 'primary' : 'neutral'"
          :class="[
            'transition-all duration-300',
            musicStore.shuffle ? 'text-cyan-500 drop-shadow-[0_0_8px_rgba(57,197,187,0.3)]' : 'text-gray-900/20 dark:text-white/30 hover:text-gray-900 dark:hover:text-white'
          ]"
          @click="musicStore.toggleShuffle"
        />

        <div class="flex items-center gap-6">
          <UButton
            icon="i-material-symbols-skip-previous"
            variant="ghost"
            color="neutral"
            size="xl"
            class="text-gray-900 dark:text-white hover:scale-110 active:scale-90"
            @click="musicStore.playPrev"
          />
          <button
            class="w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            :style="{ backgroundColor: textColor, color: musicStore.themeColor }"
            @click="musicStore.togglePlay"
          >
            <UIcon
              :name="musicStore.isPlaying ? 'i-material-symbols-pause' : 'i-material-symbols-play-arrow'"
              class="w-8 h-8"
              :class="!musicStore.isPlaying && 'ml-1'"
            />
          </button>
          <UButton
            icon="i-material-symbols-skip-next"
            variant="ghost"
            color="neutral"
            size="xl"
            class="text-gray-900 dark:text-white hover:scale-110 active:scale-90"
            @click="musicStore.playNext(false)"
          />
        </div>

        <!-- Right Side Controls (Loop & Playlist) -->
        <div class="flex items-center gap-2">
          <UButton
            :icon="musicStore.loopMode === 'one' ? 'i-material-symbols-repeat-one' : 'i-material-symbols-repeat'"
            variant="ghost"
            :color="musicStore.loopMode !== 'none' ? 'primary' : 'neutral'"
            :class="[
              'transition-all duration-300',
              musicStore.loopMode !== 'none' ? 'text-cyan-500 drop-shadow-[0_0_8px_rgba(57,197,187,0.3)]' : 'text-gray-900/20 dark:text-white/30 hover:text-gray-900 dark:hover:text-white'
            ]"
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
            @click="musicStore.isPlaylistWindowOpen = !musicStore.isPlaylistWindowOpen"
          />
        </div>
      </section>

      <!-- Independent Lyrics Module -->
      <MusicLyrics />
      <!-- Global Misskey-Style Lyrics Window -->
      <MusicLyricsWindow />
      <!-- Audio Info Analysis Window -->
      <MusicInfoWindow />
      <!-- Playlist Queue Window -->
      <MusicPlaylistWindow />

      <!-- Additional Toolbar -->
      <footer class="w-full max-w-[360px] flex items-center justify-center gap-10 mt-12 mb-6 opacity-30 hover:opacity-100 transition-opacity">
        <UButton
          icon="i-material-symbols-share"
          variant="ghost"
          color="neutral"
          size="sm"
          class="text-gray-900 dark:text-white"
        />
        <UButton
          icon="i-material-symbols-tune"
          variant="ghost"
          color="neutral"
          size="sm"
          class="text-gray-900 dark:text-white"
        />
        <UButton
          icon="i-material-symbols-info"
          variant="ghost"
          color="neutral"
          size="sm"
          class="text-gray-900 dark:text-white"
          @click="musicStore.isMusicInfoWindowOpen = true"
        />
      </footer>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 0;
  width: 0;
}
</style>
