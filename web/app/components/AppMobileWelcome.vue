<script setup lang="ts">
import { useSystemStore } from '~/stores/system'

const systemStore = useSystemStore()

function handleEnter() {
  // Use a slight delay for the ripple effect/transition to feel better
  setTimeout(() => {
    systemStore.isWelcomeDismissed = true
  }, 200)
}

function openGithub() {
  window.open('https://github.com/CyaniAgent/CyaniTalk', '_blank')
}
</script>

<template>
  <Transition name="welcome">
    <div v-if="systemStore.isLoadFinished && systemStore.isMobile && !systemStore.isWelcomeDismissed"
      class="fixed inset-0 z-[100001] flex flex-col items-center justify-center bg-white dark:bg-[#0f0f0f] p-8 overflow-hidden"
      @click="handleEnter">
      <!-- Premium Gradient Background -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          class="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-cyan-400/20 rounded-full blur-[120px] animate-pulse" />
        <div
          class="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse"
          style="animation-delay: 1s" />
      </div>

      <!-- Content Container -->
      <div class="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
        <!-- Logo/Icon Section -->
        <div class="w-24 h-24 mb-10 relative">
          <div class="absolute inset-0 bg-cyan-500/20 rounded-[30px] blur-2xl animate-pulse" />
          <div
            class="relative w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-[30px] shadow-2xl flex items-center justify-center border border-white/20">
            <UIcon name="i-material-symbols-phone-android-outline-rounded" class="w-12 h-12 text-white" />
          </div>
        </div>

        <!-- Text Content -->
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
          体验升级
        </h2>

        <p class="text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-12 px-4 text-sm">
          推荐使用 <span
            class="text-cyan-600 dark:text-cyan-400 font-black decoration-2 underline-offset-4 cursor-pointer hover:underline"
            @click.stop="openGithub">CyaniTalk App</span><br>
          获得完整的生态交互与极致性能体验。
        </p>

        <!-- Tap to Enter Footer -->
        <div class="flex flex-col items-center gap-4 animate-bounce-slow">
          <div class="w-10 h-10 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
            <UIcon name="i-material-symbols-touch-app-outline-rounded" class="w-5 h-5 text-cyan-500" />
          </div>
          <span class="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-[0.2em] uppercase">
            轻触进入
          </span>
        </div>
      </div>

      <!-- Aesthetic Grid Pattern Overlay -->
      <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 30px 30px;" />
    </div>
  </Transition>
</template>

<style scoped>
.welcome-enter-active,
.welcome-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.welcome-enter-from {
  opacity: 0;
  transform: scale(1.05);
}

.welcome-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

.animate-bounce-slow {
  animation: bounceSlow 3s infinite ease-in-out;
}

@keyframes bounceSlow {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

/* Force dark mode background if system is dark */
@media (prefers-color-scheme: dark) {
  .bg-white {
    background-color: #0f0f0f;
  }
}
</style>
