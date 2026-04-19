<script setup lang="ts">
import { useSystemStore } from '~/stores/system'
import { watch, ref } from 'vue'

const systemStore = useSystemStore()
const audioRef = ref<HTMLAudioElement | null>(null)
const restoredAudioRef = ref<HTMLAudioElement | null>(null)

// Play error sound when modal pops up
watch(() => systemStore.showConnectionErrorModal, (isOpen) => {
  if (isOpen && audioRef.value) {
    audioRef.value.currentTime = 0
    audioRef.value.play().catch(e => console.warn('Error audio playback blocked:', e))
  }
})

// Play restored sound when backend comes back online
watch(() => systemStore.isBackendOnline, (isOnline, oldVal) => {
  if (isOnline && oldVal === false && restoredAudioRef.value) {
    restoredAudioRef.value.currentTime = 0
    restoredAudioRef.value.play().catch(e => console.warn('Restored audio playback blocked:', e))
  }
})

const devModeTriggered = ref(false)
const pressTimer = ref<NodeJS.Timeout | null>(null)

const handleRefreshStart = () => {
  devModeTriggered.value = false
  pressTimer.value = setTimeout(() => {
    systemStore.enableDevMode()
    devModeTriggered.value = true
  }, 3000)
}

const handleRefreshEnd = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}

const handleRefresh = () => {
  // Only refresh if we didn't just trigger dev mode via long press
  if (!devModeTriggered.value) {
    window.location.reload()
  }
}

const handleAcknowledge = () => {
  systemStore.enableFrontendOnlyMode()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="systemStore.showConnectionErrorModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          @click.stop
        />

        <!-- M3 Dialog Surface -->
        <div class="relative bg-[#2b2930] w-[90%] max-w-[400px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col pointer-events-auto transform transition-transform scale-100 animate-pop">
          <!-- Icon / Header -->
          <div class="pt-6 px-6 flex flex-col items-center">
            <div class="w-12 h-12 rounded-full bg-[#ffb4ab] flex items-center justify-center text-[#690005] mb-4">
              <UIcon
                name="i-material-symbols-cloud-off-rounded"
                class="w-6 h-6"
              />
            </div>
            <h2 class="text-2xl font-bold text-[#e6e1e5] text-center tracking-wide">
              无法连接到服务端
            </h2>
          </div>

          <!-- Body -->
          <div class="px-6 pt-4 pb-6 text-[#cac4d0] text-sm leading-relaxed text-center font-medium">
            本实例无法连接到服务端，目前无法享受主要的在线服务。已自动进入"仅前端模式"。<br><br>
            请稍后刷新重试或联系实例管理员。
          </div>

          <!-- Actions -->
          <div class="px-6 pb-6 pt-2 flex items-center justify-end gap-2">
            <!-- Text Button for Refresh -->
            <button
              class="px-3 py-2.5 rounded-full text-[#ffb4ab] hover:bg-[#ffb4ab]/10 font-bold tracking-wider text-sm transition-colors active:scale-95 select-none"
              @click="handleRefresh"
              @mousedown="handleRefreshStart"
              @mouseup="handleRefreshEnd"
              @mouseleave="handleRefreshEnd"
              @touchstart.passive="handleRefreshStart"
              @touchend.passive="handleRefreshEnd"
            >
              刷新
            </button>
            <!-- Filled Tonal / Primary Button for OK -->
            <button
              class="px-5 py-2.5 rounded-full bg-[#ffb4ab] text-[#690005] hover:bg-[#ffb4ab]/90 font-bold tracking-wider text-sm transition-transform active:scale-95 shadow-sm shadow-[#ffb4ab]/20"
              @click="handleAcknowledge"
            >
              好的
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Hidden audio elements -->
    <audio
      ref="audioRef"
      src="/sounds/YunaAyase/sys_error.wav"
      preload="auto"
    />
    <audio
      ref="restoredAudioRef"
      src="/sounds/YunaAyase/sys_net_restored.wav"
      preload="auto"
    />
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pop {
  0% { transform: scale(0.95) translateY(10px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.animate-pop {
  animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
