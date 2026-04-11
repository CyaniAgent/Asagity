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
    <div class="relative overflow-hidden group/lyrics">
      <!-- Minimal Floating Header -->
      <div class="flex justify-between items-center mb-10 px-4">
        <h3
          class="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] uppercase drop-shadow-md"
          :style="{ color: musicStore.textColor, opacity: 0.4 }"
        >
          <span
            class="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-pulse"
            :style="{ backgroundColor: musicStore.textColor }"
          />
          Immersion Lyrics
        </h3>
        <UButton
          icon="i-material-symbols-picture-in-picture-alt"
          variant="ghost"
          color="neutral"
          class="w-10 h-10 rounded-full hover:bg-white/10 transition-all active:scale-90"
          :style="{ color: musicStore.textColor, opacity: 0.4 }"
          @click.stop="musicStore.isLyricsWindowOpen = true"
        />
      </div>

      <!-- Immersive Scrolling List with 3-Line Focus -->
      <div
        ref="previewContainer"
        class="flex flex-col overflow-hidden pointer-events-none min-h-[320px] max-h-[320px] relative px-4 mask-fade-v scroll-smooth"
      >
        <div
          v-if="musicStore.lyrics.length > 0"
          class="flex flex-col gap-4 py-32"
        >
          <div
            v-for="(line, index) in musicStore.lyrics"
            :key="index"
            :ref="(el: any) => setPreviewRef(el, index)"
            class="transition-all duration-700 flex flex-col items-center transform-gpu will-change-all"
            :class="[
              index === musicStore.currentLyricIndex
                ? 'opacity-100 scale-110 font-extrabold translate-y-0'
                : Math.abs(index - musicStore.currentLyricIndex) === 1
                  ? 'opacity-20 scale-90 blur-[1.5px] font-bold'
                  : 'opacity-0 scale-75 blur-md pointer-events-none'
            ]"
          >
            <div class="flex flex-col items-center w-full text-center py-2">
              <div
                v-for="(subLine, subIdx) in line.rawLines"
                :key="subIdx"
                :class="[
                  'leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] antialiased transition-all duration-700 font-black',
                  index === musicStore.currentLyricIndex
                    ? (subIdx === 0 ? 'text-[28px] md:text-[34px] tracking-tight' : 'text-[16px] md:text-[18px] opacity-80 mt-2')
                    : (subIdx === 0 ? 'text-[20px] md:text-[24px] tracking-normal' : 'text-[12px] md:text-[14px] opacity-40 mt-1')
                ]"
                :style="{ color: musicStore.textColor }"
              >
                {{ subLine }}
              </div>
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
    black 30%,
    black 70%,
    transparent 100%
  );
}

.will-change-all {
  will-change: transform, opacity, filter;
}

/* Hide scrollbar but keep scroll functionality */
.previewContainer {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.previewContainer::-webkit-scrollbar {
  display: none;
}
</style>
