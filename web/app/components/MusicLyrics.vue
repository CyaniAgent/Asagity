<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUpdate } from 'vue'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

const previewContainer = ref<HTMLElement | null>(null)
const previewLines = ref<HTMLElement[]>([])

onBeforeUpdate(() => {
  previewLines.value = []
})

watch(() => musicStore.currentLyricIndex, async (newIndex) => {
  if (newIndex === -1) return
  await nextTick()

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
  <div class="music-lyrics-module w-full h-full flex flex-col">
    <!-- Immersive Scrolling List -->
    <div
      ref="previewContainer"
      class="flex-1 min-h-0 flex flex-col overflow-hidden pointer-events-none relative mask-fade-v scroll-smooth"
    >
      <div
        v-if="musicStore.lyrics.length > 0"
        class="flex flex-col gap-3 py-8"
      >
        <div
          v-for="(line, index) in musicStore.lyrics"
          :key="index"
          :ref="(el: Element | null) => setPreviewRef(el, index)"
          class="transition-all duration-700 flex flex-col items-center transform-gpu will-change-all"
          :class="[
            index === musicStore.currentLyricIndex
              ? 'opacity-100 scale-110 font-extrabold translate-y-0'
              : Math.abs(index - musicStore.currentLyricIndex) === 1
                ? 'opacity-30 scale-100 blur-[0.5px] font-bold'
                : 'opacity-0 scale-75 blur-md pointer-events-none'
          ]"
        >
          <div class="flex flex-col items-center w-full text-center py-1">
            <div
              v-for="(subLine, subIdx) in line.rawLines"
              :key="subIdx"
              :class="[
                'leading-tight drop-shadow-lg antialiased transition-all duration-700 font-black',
                index === musicStore.currentLyricIndex
                  ? (subIdx === 0 ? 'text-xl tracking-tight' : 'text-sm opacity-80 mt-1')
                  : (subIdx === 0 ? 'text-base tracking-normal' : 'text-xs opacity-40')
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
        class="h-full flex items-center justify-center text-xs opacity-20 italic"
      >
        No lyrics
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask-fade-v {
  mask-image: linear-gradient(to bottom,
      transparent 0%,
      black 20%,
      black 80%,
      transparent 100%);
}

.will-change-all {
  will-change: transform, opacity, filter;
}
</style>
