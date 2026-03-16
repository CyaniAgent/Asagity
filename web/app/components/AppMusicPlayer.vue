<script setup lang="ts">
import { useMusicStore } from '~/stores/music'
import { useSplitViewStore } from '~/stores/splitView'

const musicStore = useMusicStore()
const splitViewStore = useSplitViewStore()

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleProgressChange(e: Event) {
  const target = e.target as HTMLInputElement
  musicStore.setProgress(parseFloat(target.value))
}
</script>

<template>
  <div class="flex flex-col h-full bg-[#121212] text-white overflow-hidden font-sans">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 shrink-0 bg-black/20 backdrop-blur-md z-20">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-music"
          class="text-cyan-400 w-5 h-5"
        />
        <h2 class="text-sm font-bold tracking-widest uppercase opacity-80">
          Now Playing
        </h2>
      </div>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        class="hover:bg-white/10 text-white rounded-full transition-colors"
        @click="splitViewStore.close()"
      />
    </div>

    <!-- Main Player Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center justify-center gap-10">
      <!-- Album Art with Glow -->
      <div class="relative group">
        <div class="absolute inset-0 bg-cyan-500/30 rounded-[30px] blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
        <div class="relative w-64 h-64 md:w-80 md:h-80 rounded-[30px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105 border border-white/10">
          <img
            :src="musicStore.currentTrack.albumArt"
            class="w-full h-full object-cover"
            alt="Album Art"
          >
          <!-- Decorative Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
            <span class="text-xs font-bold tracking-tighter opacity-50 uppercase">Asagity Hi-Res Audio</span>
          </div>
        </div>
      </div>

      <!-- Track Info -->
      <div class="w-full max-w-md text-center space-y-2">
        <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white line-clamp-1 hover:text-cyan-400 transition-colors cursor-default">
          {{ musicStore.currentTrack.title }}
        </h1>
        <p class="text-lg font-medium text-gray-400 hover:text-gray-200 transition-colors cursor-default">
          {{ musicStore.currentTrack.artist }}
        </p>
      </div>

      <!-- Controls & Progress -->
      <div class="w-full max-w-md space-y-6">
        <!-- Progress Bar -->
        <div class="space-y-2">
          <div class="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden group/progress pointer-events-auto">
            <input
              type="range"
              :min="0"
              :max="musicStore.currentTrack.duration"
              :value="musicStore.progress"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              @input="handleProgressChange"
            >
            <div
              class="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-300"
              :style="{ width: `${musicStore.progressPercentage}%` }"
            />
          </div>
          <div class="flex justify-between text-[11px] font-bold text-gray-500 tracking-tighter uppercase">
            <span>{{ formatTime(musicStore.progress) }}</span>
            <span>{{ formatTime(musicStore.currentTrack.duration) }}</span>
          </div>
        </div>

        <!-- Main Buttons -->
        <div class="flex items-center justify-between px-4">
          <UButton
            icon="i-lucide-shuffle"
            variant="ghost"
            color="neutral"
            class="text-gray-500 hover:text-white transition-colors"
          />
          <div class="flex items-center gap-4 md:gap-8">
            <UButton
              icon="i-lucide-skip-back"
              variant="ghost"
              color="neutral"
              size="xl"
              class="text-white hover:scale-110 transition-transform"
            />
            <button
              class="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all duration-300 group"
              @click="musicStore.togglePlay"
            >
              <UIcon
                :name="musicStore.isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
                class="w-8 h-8 md:w-10 md:h-10 transition-colors group-hover:text-cyan-600"
                :class="!musicStore.isPlaying && 'pl-1'"
              />
            </button>
            <UButton
              icon="i-lucide-skip-forward"
              variant="ghost"
              color="neutral"
              size="xl"
              class="text-white hover:scale-110 transition-transform"
            />
          </div>
          <UButton
            icon="i-lucide-repeat"
            variant="ghost"
            color="neutral"
            class="text-gray-500 hover:text-white transition-colors"
          />
        </div>

        <!-- Secondary Controls -->
        <div class="flex items-center justify-center gap-6 pt-4">
          <div class="flex items-center gap-3 group/volume">
            <UIcon
              name="i-lucide-volume-2"
              class="text-gray-500 group-hover/volume:text-cyan-400 transition-colors"
            />
            <div class="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-cyan-400/80 transition-all"
                :style="{ width: `${musicStore.volume}%` }"
              />
            </div>
          </div>
          <UButton
            icon="i-lucide-list-music"
            variant="ghost"
            color="neutral"
            class="text-gray-500 hover:text-white"
          />
        </div>
      </div>

      <!-- Lyrics / Interactive Slot -->
      <div class="w-full max-w-md mt-4">
        <div class="bg-white/5 border border-white/10 rounded-[25px] p-6 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all group">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xs font-black tracking-widest uppercase text-cyan-400">
              Lyrics
            </h3>
            <UIcon
              name="i-lucide-maximize-2"
              class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <p class="text-lg font-bold leading-relaxed line-clamp-2 text-gray-300 italic">
            "Tell your world, let the frequency touch everyone..."
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom Slider Style */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}
</style>
