<script setup lang="ts">
import { useFreeWindowStore } from '~/stores/freeWindow'
import { useSystemStore, ERROR_CODE_CONNECTION_FAILED } from '~/stores/system'
import { useSoundManager } from '~/stores/soundManager'
import { onMounted, ref, watch } from 'vue'
import { triggerHapticError } from '~/utils/haptics'

const freeWindowStore = useFreeWindowStore()
const systemStore = useSystemStore()
const soundManager = useSoundManager()

const devModeTriggered = ref(false)
const pressTimer = ref<NodeJS.Timeout | null>(null)

function playErrorSound() {
  // BUG FIX: Only play if NOT silent
  if (!freeWindowStore.errorData.silent) {
    soundManager.playIfAvailable('sys_error')
  }
}

onMounted(() => {
  // Trigger Haptic Feedback (Plan B)
  triggerHapticError()

  // If app is already launched (audio unlocked), play immediately
  if (systemStore.hasLaunched) {
    playErrorSound()
  }
})

// BUG FIX: Watch for app launch (first user interaction) to play the sound if it was blocked
watch(() => systemStore.hasLaunched, (launched) => {
  if (launched && freeWindowStore.currentViewType === 'error') {
    playErrorSound()
  }
})

const handleRefreshStart = () => {
  devModeTriggered.value = false
  pressTimer.value = setTimeout(() => {
    systemStore.enableDevMode()
    devModeTriggered.value = true
    // BUG FIX: Close window when entering dev mode
    freeWindowStore.close()
  }, 3000)
}

const handleRefreshEnd = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}

const handleRefresh = () => {
  // BUG FIX 2: Only reload if long press didn't trigger dev mode
  if (!devModeTriggered.value) {
    window.location.reload()
  }
}

const handleAcknowledge = () => {
  // Frontend-only mode is now handled automatically in system.ts
  freeWindowStore.close()
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-950/50">
    <!-- Error Icon -->
    <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-inner border border-red-500/20">
      <UIcon
        name="i-material-symbols-cloud-off-rounded"
        class="w-8 h-8"
      />
    </div>

    <!-- Error Title & Code -->
    <div class="space-y-2 mb-6">
      <div v-if="freeWindowStore.errorData.code" class="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full mb-2">
        <span class="text-[10px] font-black text-red-500 tracking-widest uppercase">{{ freeWindowStore.errorData.code }}</span>
      </div>
      <h2 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">
        {{ freeWindowStore.errorData.title }}
      </h2>
    </div>

    <!-- Error Message -->
    <p class="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-[320px] mb-8">
      {{ freeWindowStore.errorData.message }}
    </p>

    <!-- Actions -->
    <div class="flex items-center gap-3 w-full max-w-[280px]">
      <UButton
        v-if="freeWindowStore.errorData.code === ERROR_CODE_CONNECTION_FAILED"
        label="刷新页面"
        color="neutral"
        variant="soft"
        block
        class="rounded-2xl font-bold py-3"
        @click="handleRefresh"
        @mousedown="handleRefreshStart"
        @mouseup="handleRefreshEnd"
        @mouseleave="handleRefreshEnd"
        @touchstart.passive="handleRefreshStart"
        @touchend.passive="handleRefreshEnd"
      />
      <UButton
        label="好的"
        color="error"
        variant="solid"
        block
        class="rounded-2xl font-bold py-3 shadow-lg shadow-red-500/20"
        @click="handleAcknowledge"
      />
    </div>
  </div>
</template>
