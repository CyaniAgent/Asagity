<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUpdate, onMounted } from 'vue'
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
  preventDefault: true // Prevent text selection while dragging header
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

const activeColor = '#39C5BB'
</script>

<template>
  <Teleport to="body">
    <Transition name="window-pop">
      <div
        v-if="musicStore.isLyricsWindowOpen"
        :style="style"
        class="fixed z-[9999] w-[400px] h-[600px] flex flex-col bg-[#121212]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] resizable"
      >
        <!-- Draggable Header -->
        <div
          ref="handleRef"
          class="h-14 flex items-center justify-between px-6 bg-white/5 border-b border-white/5 cursor-move touch-none"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-baseline" class="w-4 h-4 text-cyan-400" />
            <span class="text-xs font-black uppercase tracking-[0.2em] text-white/60 select-none">Lyrics Window</span>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            class="w-8 h-8 rounded-full hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            @click.stop="musicStore.isLyricsWindowOpen = false"
          />
        </div>

        <!-- Track Info -->
        <div class="p-6 pb-2 shrink-0 flex items-center gap-4 bg-gradient-to-b from-white/5 to-transparent">
          <img :src="musicStore.currentTrack.albumArt" class="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/10" alt="">
          <div class="flex flex-col overflow-hidden">
            <h2 class="text-lg font-black text-white/95 truncate">{{ musicStore.currentTrack.title }}</h2>
            <p class="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] truncate">{{ musicStore.currentTrack.artist || 'Unknown Artist' }}</p>
          </div>
        </div>

        <!-- Lyrics List with Click-to-Seek -->
        <div
          ref="lyricsContainer"
          class="flex-1 overflow-y-auto custom-scrollbar px-6 pb-32"
        >
          <div v-if="musicStore.lyrics.length > 0" class="flex flex-col gap-6 py-6">
            <div
              v-for="(line, index) in musicStore.lyrics"
              :key="index"
              :ref="(el: any) => setLyricRef(el, index)"
              class="transition-all duration-500 cursor-pointer p-5 rounded-[24px] hover:bg-white/5 active:scale-95 group"
              :class="[
                musicStore.currentLyricIndex === index
                  ? 'scale-105 bg-white/10 shadow-[0_0_30px_rgba(57,197,187,0.1)] border border-white/10'
                  : 'text-white/20 hover:text-white/60'
              ]"
              @click="handleLyricClick(line.timestamp)"
            >
              <div
                v-for="(subLine, subIdx) in line.rawLines"
                :key="subIdx"
                :class="[
                  'font-black transition-colors duration-300',
                  subIdx === 0 ? 'text-2xl' : 'text-sm opacity-60 mt-2'
                ]"
                :style="musicStore.currentLyricIndex === index && subIdx === 0 ? { color: activeColor } : {}"
              >
                {{ subLine }}
              </div>
              <!-- Click Indicator (Hover) -->
              <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <UIcon name="i-lucide-play-circle" class="w-6 h-6 text-cyan-400/50" />
              </div>
            </div>
          </div>
          <div v-else class="h-full flex items-center justify-center text-white/10 italic font-black uppercase tracking-[0.3em]">
            No lyrical data
          </div>
        </div>
        
        <!-- Fading overlay for bottom -->
        <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-b-[32px]" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}
.resizable {
  resize: both;
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
