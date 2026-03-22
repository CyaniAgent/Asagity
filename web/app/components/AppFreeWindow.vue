<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDraggable } from '@vueuse/core'
import { useMusicStore } from '~/stores/music'

const props = defineProps<{
  id: string
  title: string
  icon: string
  modelValue: boolean
  initialWidth?: number
  initialHeight?: number
  initialX?: number
  initialY?: number
  zIndex?: number
}>()

const emit = defineEmits(['update:modelValue'])

const musicStore = useMusicStore()
const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)

// Window State
const width = ref(props.initialWidth || 400)
const height = ref(props.initialHeight || 600)

const { x, y, style } = useDraggable(handle, {
  initialValue: { 
    x: props.initialX ?? (typeof window !== 'undefined' ? (window.innerWidth / 2) - (width.value / 2) : 100),
    y: props.initialY ?? (typeof window !== 'undefined' ? (window.innerHeight / 2) - (height.value / 2) : 100)
  },
  preventDefault: true
})

// Resize Logic
const isResizing = ref(false)
function onResizeStart(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  const startWidth = width.value
  const startHeight = height.value
  const startX = e.clientX
  const startY = e.clientY

  const onMouseMove = (moveEvent: MouseEvent) => {
    width.value = Math.max(280, startWidth + (moveEvent.clientX - startX))
    height.value = Math.max(300, startHeight + (moveEvent.clientY - startY))
  }

  const onMouseUp = () => {
    isResizing.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="window-pop">
      <div
        v-if="modelValue"
        ref="el"
        :style="[
          style, 
          { 
            width: `${width}px`, 
            height: `${height}px`, 
            backgroundColor: musicStore.themeColor, 
            color: musicStore.textColor,
            zIndex: zIndex || 9999
          }
        ]"
        class="fixed flex flex-col backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)] select-none pointer-events-auto border-none outline-none"
      >
        <!-- Background Blur Layer -->
        <div class="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <img :src="musicStore.currentTrack.albumArt" class="w-full h-full object-cover blur-[80px]" alt="">
          <div class="absolute inset-0 bg-black/60" />
        </div>

        <!-- Header (Draggable) -->
        <div
          ref="handle"
          class="relative z-20 h-14 flex items-center justify-between px-6 bg-black/10 cursor-move active:cursor-grabbing touch-none"
        >
          <div class="flex items-center gap-2">
            <UIcon :name="icon" class="w-4 h-4 opacity-70" />
            <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{{ title }}</span>
          </div>
          <UButton
            icon="i-material-symbols-close"
            variant="ghost"
            color="neutral"
            class="w-8 h-8 rounded-full hover:bg-white/10 opacity-60 hover:opacity-100 transition-all"
            :style="{ color: musicStore.textColor }"
            @click.stop="close"
          />
        </div>

        <!-- Content Slot -->
        <div class="relative z-10 flex-1 overflow-hidden flex flex-col">
          <slot />
        </div>

        <!-- Resize Handle -->
        <div
          class="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-50 flex items-center justify-center group"
          @mousedown="onResizeStart"
        >
          <div class="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/50 transition-colors" />
        </div>
      </div>
    </Transition>
  </Teleport>
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
