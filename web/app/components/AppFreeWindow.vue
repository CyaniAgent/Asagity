<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'

const props = defineProps<{
  modelValue?: boolean
  title?: string
  icon?: string
  type?: string
  initialWidth?: number
  initialHeight?: number
  id?: string
  disableTransfer?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'close'])

const isOpen = computed({
  get: () => props.modelValue ?? true,
  set: (val) => emit('update:modelValue', val)
})

const isMaximized = ref(false)
const isMinimized = ref(false)

const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)

const { width: windowWidth, height: windowHeight } = useWindowSize()

// Initial centered position logic
const initialX = typeof window !== 'undefined' ? (window.innerWidth / 2) - ((props.initialWidth || 450) / 2) : 100
const initialY = typeof window !== 'undefined' ? (window.innerHeight / 2) - ((props.initialHeight || 600) / 2) : 100

const position = ref({ x: initialX, y: initialY })

// Make Draggable
const { x, y, style } = useDraggable(el, {
  initialValue: position.value,
  handle: handle,
  onMove(pos) {
    if (!isMaximized.value) {
      position.value = pos
    }
  }
})

function close() {
  isOpen.value = false
  emit('close')
}

function toggleMaximize() {
  isMaximized.value = !isMaximized.value
  if (isMaximized.value) isMinimized.value = false
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
  if (isMinimized.value) isMaximized.value = false
}

const windowStyle = computed(() => {
  if (isMinimized.value) {
    return { display: 'none' }
  }
  
  if (isMaximized.value) {
    return {
      top: '16px',
      left: '16px',
      width: 'calc(100vw - 32px)',
      height: 'calc(100vh - 32px)',
      transform: 'none'
    }
  }
  
  // Clamped position to prevent losing the window
  const w = props.initialWidth || 450
  const h = props.initialHeight || 650
  const clampedX = Math.min(Math.max(0, position.value.x), windowWidth.value - 100)
  const clampedY = Math.min(Math.max(0, position.value.y), windowHeight.value - 50)
  
  return {
    left: `${clampedX}px`,
    top: `${clampedY}px`,
    width: `${w}px`,
    height: `${h}px`
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-window">
      <div v-show="isOpen" 
          ref="el" 
          class="fixed z-[9990] flex flex-col rounded-[30px] border shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden transition-all"
          :class="[
            isMaximized ? 'duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]' : 'duration-0',
            isMinimized ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100',
            /* 响应式主题色绑定：为歌词等窗口提供无缝玻璃拟态质感 */
            'bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl border-gray-200/50 dark:border-gray-800/80'
          ]"
          :style="windowStyle">
        
        <!-- Drag Handle / Header -->
        <div ref="handle" class="shrink-0 w-full" :class="{ 'cursor-default': isMaximized }">
          <AppWindowHeader 
            mode="free" 
            :type="type || null"
            :customTitle="title"
            :customIcon="icon"
            :isMaximized="isMaximized"
            :isMinimized="isMinimized"
            :disableTransfer="disableTransfer"
            @close="close"
            @toggle-maximize="toggleMaximize"
            @toggle-minimize="toggleMinimize"
          />
        </div>

        <!-- Render Custom Content -->
        <div class="flex-1 overflow-auto custom-scrollbar relative flex flex-col">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-window-enter-active,
.fade-window-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-window-enter-from,
.fade-window-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
