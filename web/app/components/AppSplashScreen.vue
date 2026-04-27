<script setup lang="ts">
import { useInstanceStore } from '~/stores/instance'
import { useSystemStore } from '~/stores/system'

const instanceStore = useInstanceStore()
const systemStore = useSystemStore()

function handleRetry() {
  systemStore.initSequence()
}
</script>

<template>
  <Transition name="splash">
    <div v-if="!systemStore.isLoadFinished"
      class="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 flex items-center justify-center">
        <div
          class="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-cyan-400/30 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div class="relative z-10 flex flex-col items-center animate-fade-in-up">
        <!-- Instance Logo -->
        <div
          class="w-32 h-32 flex items-center justify-center mb-16 transform scale-100 transition-transform duration-700">
          <img v-if="instanceStore.logoURL" :src="instanceStore.logoURL" class="w-full h-full object-contain">
          <UIcon v-else name="i-material-symbols-bolt"
            class="w-20 h-20 text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        </div>

        <!-- Loading View & Error Handling -->
        <div class="relative flex flex-col items-center w-64">
          <Transition name="fade-scale" mode="out-in">
            <!-- Success/Loading State -->
            <div v-if="!systemStore.initError" :key="'loading'" class="flex flex-col items-center w-full">
              <div
                class="w-full h-[3px] bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden relative border-none">
                <!-- Android Style Indeterminate / Smooth Determinate Mix -->
                <div
                  class="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-700 ease-out absolute left-0"
                  :style="{ width: `${systemStore.initProgress}%` }" />
                <!-- Subtle pulsing light for 'Android' feel -->
                <div
                  class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>

            <!-- Error State -->
            <div v-else :key="'error'" class="flex flex-col items-center w-full">
              <div class="w-full h-1 bg-red-500/20 rounded-full overflow-hidden mb-8">
                <div class="h-full bg-red-500 w-full animate-pulse" />
              </div>

              <div class="flex flex-col items-center gap-4 text-center">
                <div
                  class="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full mb-2">
                  <UIcon name="i-material-symbols-error" class="w-4 h-4 text-red-500" />
                  <span class="text-[10px] font-black text-red-500 tracking-widest uppercase">{{
                    systemStore.initErrorCode || ERROR_CODE_UNKNOWN }}</span>
                </div>

                <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium max-w-[240px] leading-relaxed">
                  {{ systemStore.initError }}
                </p>

                <div class="flex items-center gap-3 mt-4">
                  <UButton icon="i-material-symbols-replay-rounded" label="RETRY" color="error" variant="soft" size="sm"
                    class="rounded-xl font-black px-6 tracking-widest" @click="handleRetry" />
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Fade Scale Transition for Button Switch */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}
</style>
