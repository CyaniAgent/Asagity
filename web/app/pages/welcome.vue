<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMouse, useWindowSize } from '@vueuse/core'
import { definePageMeta, navigateTo } from '#imports'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: false })

const { x, y } = useMouse()
const { width, height } = useWindowSize()

const depthX = computed(() => (x.value / width.value - 0.5) * 2)
const depthY = computed(() => (y.value / height.value - 0.5) * 2)

const showLogin = ref(false)
const showRegister = ref(false)
const userStore = useUserStore()

async function handleDeveloperEnter() {
  userStore.developerEnter()
  showLogin.value = false
  showRegister.value = false
  await navigateTo('/')
}

function openLogin() {
  showLogin.value = true
}

function openRegister() {
  showRegister.value = true
}
</script>

<template>
  <div
    class="relative w-screen h-screen overflow-hidden bg-gray-900 text-white font-sans flex items-center justify-center"
  >
    <div class="absolute inset-0 pointer-events-none z-0">
      <div
        class="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-900 to-cyan-950 transition-transform duration-75 ease-out"
        :style="{ transform: `translate3d(${depthX * -10}px, ${depthY * -10}px, 0) scale(1.05)` }"
      >
        <div class="absolute top-[20%] left-[60%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px]" />
        <div class="absolute top-[30%] left-[65%] w-[150px] h-[150px] bg-cyan-400/30 rounded-full blur-[40px]" />
      </div>

      <div
        class="absolute inset-0 opacity-40 transition-transform duration-75 ease-out"
        :style="{ transform: `translate3d(${depthX * -25}px, ${depthY * -25}px, 0) scale(1.1)` }"
      >
        <div class="absolute bottom-0 w-full h-[40vh] skyline-distant border-t border-cyan-900/50" />
      </div>

      <div
        class="absolute inset-0 transition-transform duration-75 ease-out"
        :style="{ transform: `translate3d(${depthX * -45}px, ${depthY * -45}px, 0) scale(1.1)` }"
      >
        <div
          class="absolute bottom-0 left-[8%] w-[14%] h-[60vh] bg-gray-950 border-t-2 border-cyan-500/30 rounded-tr-xl skyline-windows group"
        >
          <div class="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-16 bg-cyan-500/20 blur-md animate-pulse" />
        </div>
        <div
          class="absolute bottom-0 left-[25%] w-[10%] h-[45vh] bg-black border-t-4 border-fuchsia-500/30 rounded-tr-md skyline-windows"
        >
          <span
            class="absolute -top-10 left-0 text-[10px] font-black text-fuchsia-500/40 tracking-widest whitespace-nowrap"
          >NEO-SHINJUKU</span>
        </div>
        <div
          class="absolute bottom-0 left-[45%] w-[20%] h-[75vh] bg-gray-950 border-t-2 border-cyan-400/40 rounded-tl-3xl shadow-[0_0_40px_rgba(57,197,187,0.1)] skyline-windows flex flex-col items-center pt-20"
        >
          <div class="w-1 h-[40vh] bg-cyan-400/10 shadow-[0_0_15px_rgba(57,197,187,0.5)]" />
        </div>
        <div
          class="absolute bottom-0 right-[15%] w-[18%] h-[55vh] bg-gray-950 border-t-2 border-indigo-500/30 shadow-[inset_0_0_30px_rgba(99,102,241,0.05)] skyline-windows"
        />
      </div>

      <div
        class="absolute inset-0 transition-transform duration-75 ease-out"
        :style="{ transform: `translate3d(${depthX * -85}px, ${depthY * -85}px, 0) scale(1.2)` }"
      >
        <div class="absolute -bottom-20 -left-10 w-[25%] h-[90vh] bg-black/95 blur-[6px] border-r border-cyan-500/20" />
        <div
          class="absolute bottom-[20%] right-[10%] px-4 py-1 border-2 border-fuchsia-500/40 rounded-sm rotate-12 animate-[flicker_4s_infinite] shadow-[0_0_15px_rgba(217,70,239,0.3)]"
        >
          <span class="text-xs font-black text-fuchsia-400/60 tracking-widest uppercase">ASAGITY-SYS</span>
        </div>
      </div>
    </div>

    <div
      class="absolute bottom-10 right-10 z-20 w-[420px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-transform duration-500 ease-out hover:scale-105 hover:bg-black/50 hover:border-cyan-500/30 group"
    >
      <div class="absolute top-0 right-10 w-24 h-1 bg-cyan-500 shadow-[0_0_10px_#39C5BB]" />

      <div class="flex items-start justify-between mb-8">
        <div class="flex flex-col">
          <div class="flex items-center gap-3 mb-2">
            <AppLogo class="w-10 h-10 drop-shadow-[0_0_15px_rgba(57,197,187,0.8)]" />
            <h1 class="text-3xl font-black tracking-widest text-white drop-shadow-md">
              Asagity <span class="text-xs text-gray-500 font-bold ml-1 opacity-60">(ASGT)</span>
            </h1>
          </div>
          <span class="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase">The Skyline Hub #10241207</span>
        </div>
        <div
          class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-cyan-500/10 transition-colors"
        >
          <UIcon
            name="i-material-symbols-dns-outline"
            class="w-6 h-6 text-gray-300 group-hover:text-cyan-400 transition-colors"
          />
        </div>
      </div>

      <div class="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
        Welcome to the nexus of the fediverse. A high-performance, hyper-connected dimensional hub designed for seamless
        interaction, pristine audio, and absolute freedom.
      </div>

      <div class="flex flex-col gap-3">
        <button
          class="relative w-full overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 group/btn transition-all active:scale-[0.98]"
          @click.stop="openLogin"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500"
          />
          <div
            class="relative w-full h-full bg-black/80 backdrop-blur-sm rounded-full px-8 py-3.5 flex items-center justify-between group-hover/btn:bg-black/60 transition-colors"
          >
            <span class="font-black tracking-widest text-white">Sign In</span>
            <UIcon
              name="i-material-symbols-arrow-forward-ios-rounded"
              class="w-4 h-4 text-cyan-400 group-hover/btn:translate-x-1 transition-transform"
            />
          </div>
        </button>

        <button
          class="relative w-full overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2 focus:ring-offset-gray-900 group/btn transition-all active:scale-[0.98]"
          @click.stop="openRegister"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-fuchsia-400 to-fuchsia-500"
          />
          <div
            class="relative w-full h-full bg-black/80 backdrop-blur-sm rounded-full px-8 py-3.5 flex items-center justify-between group-hover/btn:bg-black/60 transition-colors"
          >
            <span class="font-black tracking-widest text-white">Create Account</span>
            <UIcon
              name="i-material-symbols-person-add"
              class="w-4 h-4 text-fuchsia-400 group-hover/btn:translate-x-1 transition-transform"
            />
          </div>
        </button>

        <div class="flex items-center gap-3 my-1 opacity-50">
          <div class="h-px bg-white/20 flex-1" />
          <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">or</span>
          <div class="h-px bg-white/20 flex-1" />
        </div>

        <button
          type="button"
          class="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-300 font-bold tracking-wider py-2.5 rounded-xl border border-dashed border-gray-600 hover:border-gray-500 transition-all text-xs flex items-center justify-center gap-2 group"
          @click.stop="handleDeveloperEnter"
        >
          <UIcon
            name="i-material-symbols-code-blocks-outline"
            class="w-4 h-4 group-hover:opacity-100 opacity-60"
          />
          Direct Enter (Dev Mode)
        </button>
      </div>
    </div>

    <AppFreeWindow
      v-model="showLogin"
      title="Sign In"
      icon="i-material-symbols-login"
      :initial-width="420"
      :initial-height="520"
      :z-index="10000"
      :disable-transfer="true"
      :disable-maximize="true"
      :disable-minimize="true"
      :resizable="false"
    >
      <AppAuthWindow
        mode="login"
        @switch-mode="(mode) => { showLogin = false; if (mode === 'register') showRegister = true }"
      />
    </AppFreeWindow>

    <AppFreeWindow
      v-model="showRegister"
      title="Create Account"
      icon="i-material-symbols-person-add"
      :initial-width="420"
      :initial-height="520"
      :z-index="10000"
      :disable-transfer="true"
      :disable-maximize="true"
      :disable-minimize="true"
      :resizable="false"
    >
      <AppAuthWindow
        mode="register"
        @switch-mode="(mode) => { showRegister = false; if (mode === 'login') showLogin = true }"
      />
    </AppFreeWindow>
  </div>
</template>

<style scoped>
@keyframes flicker {
  0%,
  19.999%,
  22%,
  62.999%,
  64%,
  64.999%,
  70%,
  100% {
    opacity: 0.8;
  }

  20%,
  21.999%,
  63%,
  63.999%,
  65%,
  69.999% {
    opacity: 0.2;
  }
}

.skyline-distant {
  background-image:
    linear-gradient(rgba(57, 197, 187, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(57, 197, 187, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  transform: perspective(500px) rotateX(60deg) translateY(100px) scale(3);
}

.skyline-windows {
  background-image: radial-gradient(rgba(57, 197, 187, 0.4) 1px, transparent 1px);
  background-size: 8px 12px;
  background-position: 0 0;
}
</style>
