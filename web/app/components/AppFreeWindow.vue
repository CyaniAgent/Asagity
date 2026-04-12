<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
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
  resizable?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'close'])

const isOpen = computed({
  get: () => props.modelValue ?? true,
  set: val => emit('update:modelValue', val)
})

const isMaximized = ref(false)
const isMinimized = ref(false)

const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)

const { width: windowWidth, height: windowHeight } = useWindowSize()

// Resize state
const windowSize = ref({
  width: props.initialWidth || 450,
  height: props.initialHeight || 600
})

const isResizing = ref(false)
const resizeDirection = ref('')
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })
const resizeStartPosition = ref({ x: 0, y: 0 })

// Initial centered position logic
const initialX = typeof window !== 'undefined' ? (window.innerWidth / 2) - ((props.initialWidth || 450) / 2) : 100
const initialY = typeof window !== 'undefined' ? (window.innerHeight / 2) - ((props.initialHeight || 600) / 2) : 100

const position = ref({ x: initialX, y: initialY })

// Make Draggable
useDraggable(el, {
  initialValue: position.value,
  handle: handle,
  onMove(pos) {
    if (!isMaximized.value && !isResizing.value) {
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

// Resize handlers
function startResize(direction: string, event: MouseEvent) {
  if (!props.resizable && props.resizable !== undefined) return
  if (isMaximized.value) return

  isResizing.value = true
  resizeDirection.value = direction
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  resizeStartSize.value = { ...windowSize.value }
  resizeStartPosition.value = { ...position.value }

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = `${direction}-resize`
  document.body.style.userSelect = 'none'
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return

  const deltaX = event.clientX - resizeStartPos.value.x
  const deltaY = event.clientY - resizeStartPos.value.y

  let newWidth = resizeStartSize.value.width
  let newHeight = resizeStartSize.value.height
  let newX = resizeStartPosition.value.x
  let newY = resizeStartPosition.value.y

  if (resizeDirection.value.includes('e')) {
    newWidth = Math.max(300, resizeStartSize.value.width + deltaX)
  }
  if (resizeDirection.value.includes('s')) {
    newHeight = Math.max(200, resizeStartSize.value.height + deltaY)
  }
  if (resizeDirection.value.includes('w')) {
    const widthDelta = -deltaX
    newWidth = Math.max(300, resizeStartSize.value.width + widthDelta)
    if (newWidth > 300) {
      newX = resizeStartPosition.value.x + deltaX
    }
  }
  if (resizeDirection.value.includes('n')) {
    const heightDelta = -deltaY
    newHeight = Math.max(200, resizeStartSize.value.height + heightDelta)
    if (newHeight > 200) {
      newY = resizeStartPosition.value.y + deltaY
    }
  }

  windowSize.value = { width: newWidth, height: newHeight }
  position.value = { x: newX, y: newY }
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

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
  const w = windowSize.value.width
  const h = windowSize.value.height
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
      <div
        v-show="isOpen"
        ref="el"
        class="fixed z-[9990] flex flex-col rounded-[30px] border shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden transition-all"
        :class="[
          isMaximized ? 'duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]' : 'duration-0',
          isMinimized ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100',
          /* 响应式主题色绑定：为歌词等窗口提供无缝玻璃拟态质感 */
          'bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl border-gray-200/50 dark:border-gray-800/80'
        ]"
        :style="windowStyle"
      >
        <!-- Drag Handle / Header -->
        <div
          ref="handle"
          class="shrink-0 w-full"
          :class="{ 'cursor-default': isMaximized }"
        >
          <AppWindowHeader
            mode="free"
            :type="type || null"
            :custom-title="title"
            :custom-icon="icon"
            :is-maximized="isMaximized"
            :is-minimized="isMinimized"
            :disable-transfer="disableTransfer"
            @close="close"
            @toggle-maximize="toggleMaximize"
            @toggle-minimize="toggleMinimize"
          />
        </div>

        <!-- Render Custom Content -->
        <div class="flex-1 overflow-auto custom-scrollbar relative flex flex-col">
          <slot />
        </div>

        <!-- Resize Handles -->
        <template v-if="resizable !== false">
          <!-- Corners -->
          <div
            v-if="!isMaximized"
            class="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('nw', $event)"
          />
          <div
            v-if="!isMaximized"
            class="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('ne', $event)"
          />
          <div
            v-if="!isMaximized"
            class="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('sw', $event)"
          />
          <div
            v-if="!isMaximized"
            class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('se', $event)"
          />
          <!-- Edges -->
          <div
            v-if="!isMaximized"
            class="absolute top-0 left-4 right-4 h-1 cursor-n-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('n', $event)"
          />
          <div
            v-if="!isMaximized"
            class="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('s', $event)"
          />
          <div
            v-if="!isMaximized"
            class="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('w', $event)"
          />
          <div
            v-if="!isMaximized"
            class="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize hover:bg-cyan-500/20 transition-colors z-10"
            @mousedown.stop="startResize('e', $event)"
          />
        </template>
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
