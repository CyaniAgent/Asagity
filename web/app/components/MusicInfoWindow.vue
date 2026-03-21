<script setup lang="ts">
import { ref } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()
const handleRef = ref<HTMLElement | null>(null)
const { width, height } = useWindowSize()

// Initial position: centered but slightly offset from lyrics window
const initialX = typeof window !== 'undefined' ? (window.innerWidth / 2) - 150 : 200
const initialY = typeof window !== 'undefined' ? (window.innerHeight / 2) - 200 : 200

const { x, y, style } = useDraggable(handleRef, {
  initialValue: { x: initialX, y: initialY },
  preventDefault: true
})

function formatKbps(bps?: number) {
  if (!bps) return 'N/A'
  return `${Math.round(bps / 1000)} kbps`
}

function formatSampleRate(hz?: number) {
  if (!hz) return 'N/A'
  return `${(hz / 1000).toFixed(1)} kHz`
}

const activeColor = '#39C5BB'

const qualityColors: Record<string, string> = {
  'Lossless': '#FFD700', // Gold for Lossless
  'MP3 HQ': '#39C5BB',   // Miku Green for HQ
  'MP3 Normal': '#A0A0A0', // Gray for Normal
  'Unknown': '#666666'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="window-pop">
      <div
        v-if="musicStore.isMusicInfoWindowOpen"
        :style="style"
        class="fixed z-[10000] w-[360px] flex flex-col bg-[#0f0f0f]/98 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.9)]"
      >
        <!-- Header -->
        <div
          ref="handleRef"
          class="h-14 flex items-center justify-between px-6 bg-white/5 border-b border-white/5 cursor-move touch-none"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-info" class="w-4 h-4 text-cyan-400" />
            <span class="text-xs font-black uppercase tracking-[0.2em] text-white/60 select-none">Stream Analysis</span>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            class="w-8 h-8 rounded-full hover:bg-white/20 text-white/60 hover:text-white"
            @click="musicStore.isMusicInfoWindowOpen = false"
          />
        </div>

        <!-- Main Content -->
        <div class="p-8 space-y-8">
          <!-- Identity Section -->
          <div class="flex items-start gap-6">
            <div class="relative shrink-0 group">
              <div class="absolute inset-0 bg-cyan-400/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                :src="musicStore.currentTrack.albumArt"
                class="w-24 h-24 rounded-2xl object-cover border border-white/10 relative z-10"
                alt=""
              >
            </div>
            <div class="flex flex-col min-w-0">
              <h2 class="text-xl font-black text-white leading-tight truncate">{{ musicStore.currentTrack.title }}</h2>
              <p class="text-sm font-bold text-white/40 truncate">{{ musicStore.currentTrack.artist }}</p>
              <div
                class="mt-3 self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                :style="{ 
                  borderColor: `${qualityColors[musicStore.audioQuality] || '#666'}66`,
                  color: qualityColors[musicStore.audioQuality] || '#666',
                  backgroundColor: `${qualityColors[musicStore.audioQuality] || '#666'}1A`
                }"
              >
                {{ musicStore.audioQuality }}
              </div>
            </div>
          </div>

          <!-- Technical Specs -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white/5 rounded-2xl p-4 border border-white/5 transition-colors hover:bg-white/10">
              <p class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Container</p>
              <p class="text-sm font-bold text-white">{{ musicStore.currentTrack.container || 'Unknown' }}</p>
            </div>
            <div class="bg-white/5 rounded-2xl p-4 border border-white/5 transition-colors hover:bg-white/10">
              <p class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Codec</p>
              <p class="text-sm font-bold text-white">{{ musicStore.currentTrack.codec || 'N/A' }}</p>
            </div>
            <div class="bg-white/5 rounded-2xl p-4 border border-white/5 transition-colors hover:bg-white/10">
              <p class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Bitrate</p>
              <p class="text-sm font-bold font-mono" :style="{ color: activeColor }">
                {{ formatKbps(musicStore.currentTrack.bitrate) }}
              </p>
            </div>
            <div class="bg-white/5 rounded-2xl p-4 border border-white/5 transition-colors hover:bg-white/10">
              <p class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Sampling</p>
              <p class="text-sm font-bold text-white">{{ formatSampleRate(musicStore.currentTrack.sampleRate) }}</p>
            </div>
          </div>

          <!-- ID3 Tags -->
          <div class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
              <span class="w-1 h-3 bg-cyan-500 rounded-full" />
              Meta Registry
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center text-xs">
                <span class="text-white/30 font-bold uppercase tracking-wider">Album</span>
                <span class="text-white/80 font-medium truncate ml-4 max-w-[180px]">{{ musicStore.currentTrack.album || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-white/30 font-bold uppercase tracking-wider">Release</span>
                <span class="text-white/80 font-medium">{{ musicStore.currentTrack.year || 'N/A' }}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-white/30 font-bold uppercase tracking-wider">Source ID</span>
                <span class="text-white/50 font-mono truncate ml-4 max-w-[150px]">{{ musicStore.currentTrack.id }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Decoration -->
        <div class="h-2 bg-gradient-to-r from-cyan-500 via-transparent to-cyan-500 opacity-20" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Prevent selecting text while dragging the window */
.cursor-move {
  user-select: none;
}

/* Window Pop Animation */
.window-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.window-pop-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.window-pop-enter-from,
.window-pop-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(30px) !important;
}
</style>
