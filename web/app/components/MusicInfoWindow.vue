<script setup lang="ts">
import { ref } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()
// Technical Specs Formatting

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
  'MP3 HQ': '#39C5BB', // Miku Green for HQ
  'MP3 Normal': '#A0A0A0', // Gray for Normal
  'Unknown': '#666666'
}
</script>

<template>
  <AppFreeWindow
    id="info"
    v-slot="{}"
    v-model="musicStore.isMusicInfoWindowOpen"
    title="Stream Analysis"
    icon="i-material-symbols-info"
    :initial-width="360"
    :initial-height="500"
    :z-index="10000"
  >
    <!-- Main Content -->
    <div class="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
      <!-- Identity Section -->
      <div class="flex items-start gap-6">
        <div class="relative shrink-0 group">
          <div class="absolute inset-0 bg-white/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <img
            :src="musicStore.currentTrack.albumArt"
            class="w-24 h-24 rounded-2xl object-cover relative z-10"
            alt=""
          >
        </div>
        <div class="flex flex-col min-w-0">
          <h2 class="text-xl font-black leading-tight truncate">{{ musicStore.currentTrack.title }}</h2>
          <p class="text-sm font-bold opacity-60 truncate">{{ musicStore.currentTrack.artist || 'Unknown Artist' }}</p>
          <div
            class="mt-3 self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            :style="{ 
              color: musicStore.textColor,
              backgroundColor: `${musicStore.textColor}1A`
            }"
          >
            {{ musicStore.audioQuality }}
          </div>
        </div>
      </div>

      <!-- Technical Specs -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-black/10 rounded-2xl p-4 transition-colors hover:bg-white/5">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Container</p>
          <p class="text-sm font-bold">{{ musicStore.currentTrack.container || 'Unknown' }}</p>
        </div>
        <div class="bg-black/10 rounded-2xl p-4 transition-colors hover:bg-white/5">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Codec</p>
          <p class="text-sm font-bold">{{ musicStore.currentTrack.codec || 'N/A' }}</p>
        </div>
        <div class="bg-black/10 rounded-2xl p-4 transition-colors hover:bg-white/5">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Bitrate</p>
          <p class="text-sm font-bold font-mono opacity-90">
            {{ formatKbps(musicStore.currentTrack.bitrate) }}
          </p>
        </div>
        <div class="bg-black/10 rounded-2xl p-4 transition-colors hover:bg-white/5">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Sampling</p>
          <p class="text-sm font-bold opacity-90">{{ formatSampleRate(musicStore.currentTrack.sampleRate) }}</p>
        </div>
      </div>

      <!-- ID3 Tags -->
      <div class="space-y-4">
        <h3 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
          <span class="w-1 h-3 rounded-full" :style="{ backgroundColor: musicStore.textColor }" />
          Meta Registry
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center text-xs">
            <span class="opacity-30 font-bold uppercase tracking-wider">Album</span>
            <span class="font-medium truncate ml-4 max-w-[180px] opacity-80">{{ musicStore.currentTrack.album || 'Unknown' }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="opacity-30 font-bold uppercase tracking-wider">Release</span>
            <span class="font-medium opacity-80">{{ musicStore.currentTrack.year || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="opacity-30 font-bold uppercase tracking-wider">Source ID</span>
            <span class="font-mono truncate ml-4 max-w-[150px] opacity-40">{{ musicStore.currentTrack.id }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Decoration -->
    <div class="h-2 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-10" />
  </AppFreeWindow>
</template>

<style scoped>
.window-pop-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.window-pop-leave-active {
  transition: all 0.3s cubic-bezier(0.36, 0, 0.66, -0.56);
}
.window-pop-enter-from, .window-pop-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
