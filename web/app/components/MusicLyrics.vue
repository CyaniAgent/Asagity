<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUpdate } from 'vue'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

// Refs for auto-scrolling preview
const previewContainer = ref<HTMLElement | null>(null)
const previewLines = ref<HTMLElement[]>([])

onBeforeUpdate(() => {
  previewLines.value = []
})

// Centralized auto-scroll logic for preview
watch(() => musicStore.currentLyricIndex, async (newIndex) => {
  if (newIndex === -1) return
  await nextTick()

  // Scroll preview (if visible)
  const pLine = previewLines.value[newIndex]
  if (previewContainer.value && pLine) {
    scrollToActive(previewContainer.value, pLine)
  }
})

function scrollToActive(container: HTMLElement, activeLine: HTMLElement) {
  const top = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2)
  container.scrollTo({ top, behavior: 'smooth' })
}

function setPreviewRef(el: Element | null, index: number) {
  if (el) previewLines.value[index] = el as HTMLElement
}
</script>

<template>
  <div class="music-lyrics-module w-full max-w-[540px] px-2">
    <!-- Immersive Container (Zero Border) -->
    <div class="relative overflow-hidden group/lyrics">
      <!-- Minimal Floating Header -->
      <div class="flex justify-between items-center mb-6 px-4">
        <h3 class="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-white/40 uppercase drop-shadow-md">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#39C5BB] animate-pulse" />
          Immersion Lyrics
        </h3>
        <UButton
          icon="i-lucide-picture-in-picture-2"
          variant="ghost"
          color="neutral"
          class="w-10 h-10 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-90"
          @click.stop="musicStore.isLyricsWindowOpen = true"
        />
      </div>

      <!-- Immersive Spotify-Style Lyrics List -->
      <div
        ref="previewContainer"
        class="flex flex-col gap-6 overflow-hidden pointer-events-none max-h-[420px] relative px-4 mask-fade-v"
      >
        <div v-if="musicStore.lyrics.length > 0" class="space-y-6 pb-40 pt-10">
          <div
            v-for="(line, index) in musicStore.lyrics"
            :key="index"
            :ref="(el: any) => setPreviewRef(el, index)"
            :class="[
              'transition-all duration-700 flex flex-col gap-2 transform-gpu will-change-transform',
              musicStore.currentLyricIndex === index
                ? 'opacity-100 scale-105 translate-x-1'
                : 'opacity-25 blur-[2.5px] scale-95'
            ]"
          >
            <div
              v-for="(subLine, subIdx) in line.rawLines"
              :key="subIdx"
              :class="[
                'font-black leading-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] antialiased',
                subIdx === 0 ? 'text-[24px] md:text-[28px] tracking-tight' : 'text-[14px] md:text-[16px] opacity-70 font-bold'
              ]"
            >
              {{ subLine }}
            </div>
          </div>
        </div>
        <div
          v-else
          class="h-60 flex items-center justify-center text-white/10 text-sm italic tracking-[0.2em] font-black uppercase"
        >
          No signals found
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask-fade-v {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
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
</style>
