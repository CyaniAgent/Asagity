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

const activeColor = '#39C5BB'
</script>

<template>
  <div class="music-lyrics-module w-full max-w-[480px]">
    <!-- Compact Preview Section -->
    <div class="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 backdrop-blur-3xl relative overflow-hidden group/lyrics shadow-2xl transition-all duration-500 hover:bg-white/[0.05]">
      <div class="flex justify-between items-center mb-6">
        <h3 class="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-cyan-400">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#39C5BB] animate-pulse" />
          Immersion Lyrics
        </h3>
        <UButton
          icon="i-lucide-picture-in-picture-2"
          variant="ghost"
          color="neutral"
          class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-90"
          @click.stop="musicStore.isLyricsWindowOpen = true"
        />
      </div>

      <!-- Preview Lyrics (Manual Interaction Disabled) -->
      <div
        ref="previewContainer"
        class="flex flex-col gap-6 overflow-hidden pointer-events-none max-h-[160px] relative px-2"
      >
        <div v-if="musicStore.lyrics.length > 0" class="space-y-4 pb-20">
          <div
            v-for="(line, index) in musicStore.lyrics"
            :key="index"
            :ref="(el: any) => setPreviewRef(el, index)"
            :class="[
              'transition-all duration-700 px-4 py-3 rounded-2xl flex flex-col gap-1.5',
              musicStore.currentLyricIndex === index
                ? 'text-white translate-x-1 bg-white/[0.07] shadow-lg'
                : 'text-white/15 blur-[0.5px]'
            ]"
          >
            <div
              v-for="(subLine, subIdx) in line.rawLines"
              :key="subIdx"
              :class="[
                'font-black leading-tight',
                subIdx === 0 ? 'text-[18px] md:text-[21px]' : 'text-[14px] opacity-60 font-bold'
              ]"
              :style="musicStore.currentLyricIndex === index && subIdx === 0 ? { color: activeColor } : {}"
            >
              {{ subLine }}
            </div>
          </div>
        </div>
        <div v-else class="h-40 flex items-center justify-center text-white/10 text-xs italic tracking-widest font-black uppercase">
          No signals found
        </div>
      </div>
      
      <!-- Fading overlay for preview -->
      <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  </div>
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
