<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUpdate } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

const handleRef = ref<HTMLElement | null>(null)
const lyricsContainer = ref<HTMLElement | null>(null)
const lyricLines = ref<HTMLElement[]>([])

const { width, height } = useWindowSize()

// Center the window initially
const initialX = typeof window !== 'undefined' ? (window.innerWidth / 2) - 200 : 100
const initialY = typeof window !== 'undefined' ? (window.innerHeight / 2) - 300 : 100

const { x, y, style } = useDraggable(handleRef, {
  initialValue: { x: initialX, y: initialY },
  preventDefault: true
})

onBeforeUpdate(() => {
  lyricLines.value = []
})

// Auto-scroll inside the free window
watch(() => musicStore.currentLyricIndex, async (newIndex) => {
  if (newIndex === -1 || !lyricsContainer.value || !musicStore.isLyricsWindowOpen) return

  await nextTick()
  const activeLine = lyricLines.value[newIndex]
  if (activeLine) {
    const container = lyricsContainer.value
    const top = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2)
    container.scrollTo({ top, behavior: 'smooth' })
  }
})

// Scroll to correct position when opened
watch(() => musicStore.isLyricsWindowOpen, async (open) => {
  if (open && musicStore.currentLyricIndex !== -1) {
    await nextTick()
    const activeLine = lyricLines.value[musicStore.currentLyricIndex]
    if (lyricsContainer.value && activeLine) {
      const container = lyricsContainer.value
      const top = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2)
      container.scrollTo({ top, behavior: 'smooth' })
    }
  }
})

function setLyricRef(el: Element | null, index: number) {
  if (el) lyricLines.value[index] = el as HTMLElement
}

function handleLyricClick(timestamp: number) {
  musicStore.seek(timestamp)
}
</script>

<template>
  <AppFreeWindow
    id="lyrics"
    v-model="musicStore.isLyricsWindowOpen"
    title="Lyrics Window"
    icon="i-material-symbols-format-color-text"
    :initial-width="400"
    :initial-height="600"
    disable-transfer
  >
    <!-- Track Info -->
    <div class="p-6 pb-2 shrink-0 flex items-center gap-4 bg-gradient-to-b from-black/20 to-transparent">
      <img :src="musicStore.currentTrack.albumArt" class="w-14 h-14 rounded-2xl object-cover shadow-lg" alt="">
      <div class="flex flex-col overflow-hidden">
        <h2 class="text-lg font-black truncate">{{ musicStore.currentTrack.title }}</h2>
        <p class="text-[12px] font-bold truncate opacity-60">{{ musicStore.currentTrack.artist || 'Unknown Artist' }}</p>
      </div>
    </div>

    <!-- Lyrics List with Click-to-Seek -->
    <div
      ref="lyricsContainer"
      class="flex-1 overflow-y-auto custom-scrollbar px-10 pb-20 pt-4"
    >
      <div v-if="musicStore.lyrics.length > 0" class="flex flex-col gap-4">
        <div
          v-for="(line, index) in musicStore.lyrics"
          :key="index"
          :ref="(el: any) => setLyricRef(el, index)"
          class="transition-all duration-500 cursor-pointer py-1 group relative origin-left"
          :class="[
            musicStore.currentLyricIndex === index
              ? 'scale-[1.15] opacity-100 font-extrabold'
              : 'opacity-40 hover:opacity-80 scale-100'
          ]"
          @click="handleLyricClick(line.timestamp)"
        >
          <div
            v-for="(subLine, subIdx) in line.rawLines"
            :key="subIdx"
            :class="[
              'transition-colors duration-300',
              subIdx === 0 ? 'text-2xl' : 'text-sm opacity-60 mt-1'
            ]"
          >
            {{ subLine }}
          </div>
          <!-- Click Indicator (Hover) -->
          <div class="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <UIcon name="i-material-symbols-play-arrow" class="w-4 h-4 opacity-50" />
          </div>
        </div>
      </div>
      <div v-else class="h-full flex items-center justify-center opacity-20 italic font-black uppercase tracking-[0.3em]">
        No lyrical data
      </div>
    </div>
    
    <!-- Fading overlay for bottom -->
    <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none rounded-b-[32px]" />
  </AppFreeWindow>
</template>

<style scoped>
.mask-fade-v {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
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
.resizable {
  resize: both;
}
</style>
