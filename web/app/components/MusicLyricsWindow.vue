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
  <Teleport to="body">
    <Transition name="window-pop">
      <div
        v-if="musicStore.isLyricsWindowOpen"
        :style="style"
        class="fixed z-[9999] w-[450px] h-[650px] flex flex-col bg-[#121212]/95 backdrop-blur-3xl border border-white/5 rounded-[32px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] resizable"
      >
        <!-- Immersive Background for Window -->
        <div class="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <img :src="musicStore.currentTrack.albumArt" class="w-full h-full object-cover blur-[80px]" alt="">
          <div class="absolute inset-0 bg-black/60" />
        </div>

        <!-- Draggable Content (Relative to ensure visibility over backdrop) -->
        <div class="relative z-10 flex flex-col h-full bg-transparent">
          <!-- Draggable Header -->
          <div
            ref="handleRef"
            class="h-16 flex items-center justify-between px-6 cursor-move touch-none border-b border-white/5"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-baseline" class="w-4 h-4 text-cyan-500" />
              <div class="flex flex-col">
                <span class="text-[10px] font-black tracking-[0.2em] text-white/60 select-none uppercase">Lyrics Universe</span>
                <span class="text-[9px] font-bold text-cyan-500/80 truncate max-w-[200px]">{{ musicStore.currentTrack.title }}</span>
              </div>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              class="w-8 h-8 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              @click.stop="musicStore.isLyricsWindowOpen = false"
            />
          </div>

          <!-- Lyrics List (Spotify Focus Blur Style) -->
          <div
            ref="lyricsContainer"
            class="flex-1 overflow-y-auto custom-scrollbar px-8 py-10 mask-fade-v"
          >
            <div v-if="musicStore.lyrics.length > 0" class="flex flex-col gap-6 pb-40">
              <div
                v-for="(line, index) in musicStore.lyrics"
                :key="index"
                :ref="(el: any) => setLyricRef(el, index)"
                class="transition-all duration-700 cursor-pointer flex flex-col gap-2 transform-gpu will-change-transform"
                :class="[
                  musicStore.currentLyricIndex === index
                    ? 'opacity-100 scale-105 translate-x-2'
                    : 'opacity-20 blur-[2.5px] scale-95'
                ]"
                @click="handleLyricClick(line.timestamp)"
              >
                <div
                  v-for="(subLine, subIdx) in line.rawLines"
                  :key="subIdx"
                  :class="[
                    'font-black text-white drop-shadow-2xl antialiased',
                    subIdx === 0 ? 'text-[26px] md:text-[30px] leading-tight tracking-tight' : 'text-[16px] md:text-[18px] opacity-60 mt-1 font-bold'
                  ]"
                >
                  {{ subLine }}
                </div>
              </div>
            </div>
            <div v-else class="h-full flex items-center justify-center text-white/10 italic font-black tracking-[0.3em]">
              No lyrical data
            </div>
          </div>
        </div>

        <!-- Fading overlay for bottom -->
        <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none rounded-b-[32px] z-20" />
      </div>
    </Transition>
  </Teleport>
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
