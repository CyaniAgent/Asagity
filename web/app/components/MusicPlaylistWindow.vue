<script setup lang="ts">
import { useMusicStore } from '~/stores/music'
import AppFreeWindow from './AppFreeWindow.vue'

const musicStore = useMusicStore()

function playTrack(index: number) {
  musicStore.setTrackByIndex(index)
}
</script>

<template>
  <AppFreeWindow
    id="playlist"
    v-model="musicStore.isPlaylistWindowOpen"
    title="Playback Queue"
    icon="i-material-symbols-queue-music"
    :initial-width="380"
    :initial-height="520"
    :z-index="10001"
    disable-transfer
  >
    <!-- Playlist Scrollable Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2 relative z-10">
      <!-- Current Track Header Info -->
      <div class="mb-4 px-2 select-none">
        <h3 class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 flex items-center gap-2">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :style="{ backgroundColor: musicStore.textColor }"
          />
          Current Queue
        </h3>
        <p class="text-xs font-bold opacity-60">
          {{ musicStore.playlist.length }} Tracks in Total
        </p>
      </div>

      <!-- Track List -->
      <div
        v-for="(track, index) in musicStore.playlist"
        :key="track.id"
        class="group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 select-none"
        :class="[
          musicStore.currentIndex === index
            ? 'bg-white/10 shadow-md scale-[1.02]'
            : 'hover:bg-white/5 opacity-60 hover:opacity-100 hover:-translate-x-1'
        ]"
        @dblclick="playTrack(index)"
      >
        <!-- Left: Index / Playing Icon & Info -->
        <div class="flex items-center gap-4 overflow-hidden">
          <!-- Status Icon -->
          <div class="w-6 h-6 shrink-0 flex items-center justify-center opacity-70">
            <UIcon
              v-if="musicStore.currentIndex === index && musicStore.isPlaying"
              name="i-material-symbols-volume-up"
              class="w-4 h-4 text-cyan-500 animate-pulse drop-shadow-[0_0_5px_rgba(57,197,187,0.5)]"
              :style="{ color: musicStore.themeColor }"
            />
            <UIcon
              v-else-if="musicStore.currentIndex === index && !musicStore.isPlaying"
              name="i-material-symbols-volume-off"
              class="w-4 h-4"
            />
            <span
              v-else
              class="text-xs font-bold font-mono"
            >{{ index + 1 }}</span>
          </div>

          <!-- Track Text -->
          <div class="flex flex-col min-w-0">
            <span
              class="text-sm font-black truncate transition-colors duration-300"
              :class="musicStore.currentIndex === index ? 'text-cyan-500 drop-shadow-sm' : ''"
              :style="musicStore.currentIndex === index ? { color: musicStore.themeColor, filter: 'brightness(1.5)' } : {}"
            >
              {{ track.title || track.url.split('/').pop() }}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-widest truncate opacity-50 mt-0.5">
              {{ track.artist || 'Local Track' }}
            </span>
          </div>
        </div>

        <!-- Right: Action Hover (Play Button) -->
        <div class="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity px-2">
          <UButton
            icon="i-material-symbols-play-circle"
            variant="ghost"
            class="w-8 h-8 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
            :style="{ color: musicStore.textColor }"
            @click.stop="playTrack(index)"
          />
        </div>
      </div>
    </div>

    <!-- Fade Overlay -->
    <div class="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/20 to-transparent z-20" />
  </AppFreeWindow>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
</style>
