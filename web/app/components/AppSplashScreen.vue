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
    <div
      v-if="!systemStore.hasLaunched"
      class="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden"
    >
      <!-- Background Effects -->
      <div class="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 flex items-center justify-center">
        <div
          class="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-cyan-400/30 rounded-full blur-[120px] animate-pulse"
        />
      </div>

      <div class="relative z-10 flex flex-col items-center animate-fade-in-up">
        <!-- Instance Logo -->
        <div
          class="w-32 h-32 flex items-center justify-center mb-10 transform scale-100 hover:scale-105 transition-transform duration-500"
        >
          <img
            v-if="instanceStore.logoURL"
            :src="instanceStore.logoURL"
            class="w-full h-full object-cover"
          >
          <UIcon
            v-else
            name="i-material-symbols-bolt"
            class="w-16 h-16 text-cyan-500"
          />
        </div>

        <!-- Welcome Text -->
        <div class="text-center mb-16">
          <span class="text-gray-900/40 dark:text-white/40 text-sm block mb-1 font-black tracking-[0.2em] uppercase">
            Welcome to
          </span>
          <h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
            {{ instanceStore.name }}
          </h1>
        </div>

        <!-- Loading View & Error Handling -->
        <div class="relative flex flex-col items-center min-h-[140px] w-80">
          <Transition
            name="fade-scale"
            mode="out-in"
          >
            <!-- Success/Loading State -->
            <div
              v-if="!systemStore.initError"
              :key="'loading'"
              class="flex flex-col items-center w-full"
            >
              <div
                class="w-full h-1 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden mb-4 border border-black/5 dark:border-white/5"
              >
                <div
                  class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
                  :style="{ width: `${systemStore.initProgress}%` }"
                />
              </div>
              <!-- Unique key ensures clean re-renders -->
              <div
                :key="systemStore.hasLaunched ? 'launched' : 'loading'"
                class="text-[10px] font-black tracking-[0.3em] text-cyan-500 uppercase flex items-center justify-center gap-2"
              >
                <UIcon
                  name="i-material-symbols-sync-rounded"
                  class="w-3 h-3 animate-spin"
                />
                <span>Initializing... {{ systemStore.initProgress }}%</span>
              </div>
            </div>

            <!-- Error State -->
            <div
              v-else
              :key="'error'"
              class="flex flex-col items-center w-full"
            >
              <div class="w-full h-1 bg-red-500/20 rounded-full overflow-hidden mb-6">
                <div class="h-full bg-red-500 w-full animate-pulse" />
              </div>

              <div class="flex flex-col items-center gap-4 text-center">
                <!-- Error Code Badge -->
                <div class="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full mb-2">
                  <UIcon
                    name="i-material-symbols-error"
                    class="w-4 h-4 text-red-500"
                  />
                  <span class="text-xs font-black text-red-500 tracking-widest">{{ systemStore.initErrorCode || 'ERR UNKNOWN' }}</span>
                </div>

                <div class="flex items-center gap-2 text-red-500 mb-2">
                  <UIcon
                    name="i-material-symbols-gpp-maybe"
                    class="w-5 h-5"
                  />
                  <span class="text-xs font-black tracking-widest uppercase">System Initialization Failed</span>
                </div>

                <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium max-w-[280px] leading-relaxed">
                  {{ systemStore.initError }}
                </p>

                <div class="flex items-center gap-3 mt-4">
                  <UButton
                    icon="i-material-symbols-replay-rounded"
                    label="重试"
                    color="error"
                    variant="soft"
                    size="sm"
                    class="rounded-xl font-bold px-4 border border-red-500/20"
                    @click="handleRetry"
                  />
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

/* Material Design Style Circular Loader Animation */
.loader-circular {
  animation: rotate 2s linear infinite;
}

.loader-path {
  stroke-dasharray: 1, 200;
  stroke-dashoffset: 0;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35px;
  }

  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124px;
  }
}
</style>
