<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInstanceStore } from '~/stores/instance'

const instanceStore = useInstanceStore()
const isVisible = ref(true)
const isLeaving = ref(false)

onMounted(() => {
  // Ensure the splash screen is visible for at least 1.5 seconds so the user can enjoy the branding
  setTimeout(() => {
    isLeaving.value = true
    setTimeout(() => {
      isVisible.value = false
    }, 500) // Match the transition duration in CSS
  }, 1500)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="splash">
      <div 
        v-if="isVisible" 
        class="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] transition-opacity duration-500 overflow-hidden" 
        :class="{ 'opacity-0': isLeaving }"
      >
        <!-- Background Effects -->
        <div class="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 flex items-center justify-center">
          <div class="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-cyan-400/30 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div class="relative z-10 flex flex-col items-center animate-fade-in-up">
           <!-- Instance Logo -->
           <div class="w-32 h-32 bg-gradient-to-br from-cyan-400 to-primary-600 rounded-[32px] flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-gray-900/5 dark:ring-white/10 mb-10 transform scale-100 hover:scale-105 transition-transform duration-500">
            <img v-if="instanceStore.logoURL" :src="instanceStore.logoURL" class="w-full h-full object-cover">
            <UIcon v-else name="i-lucide-zap" class="w-16 h-16 text-white" />
          </div>

          <!-- Welcome Text -->
          <h1 class="text-3xl font-black text-gray-900 dark:text-white text-center tracking-tight mb-16 drop-shadow-sm leading-snug">
            <span class="text-gray-900/40 dark:text-white/40 text-xl block mb-2 font-bold tracking-widest">
              欢迎来到
            </span>
            {{ instanceStore.name }}
          </h1>

          <!-- Android Style Indeterminate Circular Progress -->
          <div class="relative flex flex-col items-center">
            <svg class="w-12 h-12 text-cyan-500 origin-center loader-circular" viewBox="0 0 50 50">
              <circle 
                cx="25" cy="25" r="20" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="4" 
                stroke-linecap="round" 
                class="loader-path"
              />
            </svg>
            <div class="mt-4 text-[10px] font-black tracking-widest text-cyan-500/50 uppercase">Loading</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
