<script setup lang="ts">
import { computed } from 'vue'
import { useMusicStore } from '~/stores/music'
import { useSplitViewStore } from '~/stores/splitView'
import MusicLyrics from '~/components/MusicLyrics.vue'

const musicStore = useMusicStore()
const splitViewStore = useSplitViewStore()

// Dynamic theme color from album art (fallback to Miku Green)
const activeColor = computed(() => {
  return '#39C5BB'
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

function handleVolumeChange(e: Event) {
  const target = e.target as HTMLInputElement
  musicStore.setVolume(parseInt(target.value))
}
</script>

<template>
  <div class="relative flex flex-col h-full bg-black text-white overflow-hidden font-sans select-none">
    <!-- Immersive Blurred Backdrop -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        :src="musicStore.currentTrack.albumArt"
        class="w-full h-full object-cover scale-150 blur-[80px] opacity-40 transition-all duration-1000"
        alt=""
      >
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
    </div>

    <!-- Absolute Navigation Header -->
    <header class="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-50 pointer-events-auto">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
          <UIcon
            name="i-lucide-music"
            class="text-cyan-400 w-4 h-4"
          />
        </div>
        <span class="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">Now Playing</span>
      </div>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        class="w-10 h-10 rounded-full hover:bg-white/10 text-white transition-all active:scale-90"
        @click="splitViewStore.close()"
      />
    </header>

    <!-- Main Scrollable Content -->
    <div class="relative z-10 flex-1 overflow-y-auto custom-scrollbar pt-24 pb-12 px-6 flex flex-col items-center">
      <!-- Loading Overlay -->
      <div
        v-if="musicStore.isLoading"
        class="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-6">
          <UIcon
            name="i-lucide-loader-2"
            class="w-12 h-12 text-cyan-500 animate-spin"
          />
          <p class="text-xs font-black tracking-[0.2em] uppercase text-white/70">
            Asagity Rendering...
          </p>
        </div>
      </div>

      <!-- Large Center Piece: Album Art -->
      <section class="w-full max-w-[320px] aspect-square relative mb-10 group shrink-0">
        <div
          class="absolute inset-0 bg-cyan-500/20 rounded-[40px] blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
          :style="{ backgroundColor: `${activeColor}33` }"
        />
        <div class="relative w-full h-full rounded-[40px] overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] border border-white/10 transition-transform duration-700 ease-out group-hover:scale-[1.02]">
          <img
            :src="musicStore.currentTrack.albumArt"
            class="w-full h-full object-cover transition-all duration-700"
            alt="Album Art"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </section>

      <!-- Track Information -->
      <section class="w-full max-w-[340px] mb-8 space-y-1 text-center md:text-left">
        <h1 class="text-2xl md:text-3xl font-black tracking-tight leading-tight text-white/95 truncate">
          {{ musicStore.currentTrack.title }}
        </h1>
        <p class="text-lg font-bold text-white/50 truncate flex items-center justify-center md:justify-start gap-2">
          <span>{{ musicStore.currentTrack.artist || 'Unknown Artist' }}</span>
          <span class="w-1 h-1 bg-white/20 rounded-full" />
          <span class="text-sm opacity-60">Hi-Res</span>
        </p>
      </section>

      <!-- Interactive Seeker & Time -->
      <section class="w-full max-w-[360px] mb-8 space-y-3">
        <div class="relative w-full h-1.5 bg-white/10 rounded-full group cursor-pointer">
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
        <div class="flex justify-between text-[10px] font-black tracking-widest text-white/40 font-mono">
          <span>{{ formatTime(musicStore.progress) }}</span>
          <span>{{ formatTime(musicStore.currentTrack.duration) }}</span>
        </div>
      </section>

      <!-- Playback Controls -->
      <section class="w-full max-w-[360px] flex items-center justify-around mb-12">
        <UButton
          :icon="musicStore.shuffle ? 'i-lucide-shuffle' : 'i-lucide-shuffle'"
          variant="ghost"
          :color="musicStore.shuffle ? 'primary' : 'neutral'"
          :class="[
            'transition-all duration-300',
            musicStore.shuffle ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(57,197,187,0.5)]' : 'text-white/30 hover:text-white'
          ]"
          @click="musicStore.toggleShuffle"
        />

        <div class="flex items-center gap-6">
          <UButton
            icon="i-lucide-skip-back"
            variant="ghost"
            color="neutral"
            size="xl"
            class="text-white hover:scale-110 active:scale-90"
            @click="musicStore.playPrev"
          />
          <button
            class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all"
            @click="musicStore.togglePlay"
          >
            <UIcon
              :name="musicStore.isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
              class="w-8 h-8"
              :class="!musicStore.isPlaying && 'ml-1'"
            />
          </button>
          <UButton
            icon="i-lucide-skip-forward"
            variant="ghost"
            color="neutral"
            size="xl"
            class="text-white hover:scale-110 active:scale-90"
            @click="musicStore.playNext(false)"
          />
        </div>

        <UButton
          :icon="musicStore.loopMode === 'one' ? 'i-lucide-repeat-1' : 'i-lucide-repeat'"
          variant="ghost"
          :color="musicStore.loopMode !== 'none' ? 'primary' : 'neutral'"
          :class="[
            'transition-all duration-300',
            musicStore.loopMode !== 'none' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(57,197,187,0.5)]' : 'text-white/30 hover:text-white'
          ]"
          @click="musicStore.toggleLoopMode"
        />
      </section>

      <!-- Independent Lyrics Module -->
      <MusicLyrics />
      <!-- Global Misskey-Style Lyrics Window -->
      <MusicLyricsWindow />
      <!-- Audio Info Analysis Window -->
      <MusicInfoWindow />

      <!-- Additional Toolbar -->
      <footer class="w-full max-w-[360px] flex items-center justify-center gap-10 mt-12 mb-6 opacity-40 hover:opacity-100 transition-opacity">
        <UButton
          icon="i-lucide-share-2"
          variant="ghost"
          color="neutral"
          size="sm"
        />
        <UButton
          icon="i-lucide-settings-2"
          variant="ghost"
          color="neutral"
          size="sm"
        />
        <UButton
          icon="i-lucide-info"
          variant="ghost"
          color="neutral"
          size="sm"
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 0;
  width: 0;
}
</style>
