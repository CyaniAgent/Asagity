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

const showOnboarding = ref(false)
const userStore = useUserStore()

async function handleDeveloperEnter() {
  userStore.developerEnter()
  showOnboarding.value = false
  await navigateTo('/')
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

      <div class="flex flex-col gap-4">
        <button
          class="relative w-full overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 group/btn transition-transform active:scale-95"
          @click.stop="showOnboarding = true"
        >
          <span
            class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full animate-[spin_3s_linear_infinite]"
          />
          <div
            class="relative w-full h-full bg-black/80 backdrop-blur-sm rounded-full px-8 py-3.5 flex items-center justify-between group-hover/btn:bg-black/60 transition-colors"
          >
            <span class="font-black tracking-widest text-white">Start</span>
            <UIcon
              name="i-material-symbols-arrow-forward-ios-rounded"
              class="w-4 h-4 text-cyan-400 group-hover/btn:translate-x-1 transition-transform"
            />
          </div>
        </button>
      </div>
    </div>

    <AppFreeWindow
      id="onboarding"
      v-model="showOnboarding"
      title="Instance Covenant #10241207"
      icon="i-material-symbols-gpp-good"
      :initial-width="850"
      :initial-height="550"
      :z-index="10000"
    >
      <div class="h-full flex flex-col md:flex-row overflow-hidden bg-black/40">
        <div class="md:w-3/5 p-8 flex flex-col border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-[200px] h-[200px] bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

          <div class="flex items-center gap-3 mb-8">
            <UIcon
              name="i-material-symbols-gpp-good"
              class="w-6 h-6 text-cyan-400"
            />
            <h2 class="text-xl font-black text-white tracking-wider">
              Instance Covenant
            </h2>
          </div>

          <div class="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            <div class="space-y-6 text-sm text-gray-300 font-medium">
              <section>
                <h3 class="text-cyan-400 font-bold mb-2 uppercase tracking-wide text-xs">
                  I. Respect the Skyline
                </h3>
                <p>Welcome to Instance #10241207. Treat all interconnected users with absolute respect. No harassment, spam, or malicious dimensional rifts will be tolerated.</p>
              </section>
              <section>
                <h3 class="text-cyan-400 font-bold mb-2 uppercase tracking-wide text-xs">
                  II. Content Directives
                </h3>
                <p>Ensure your drops and media strictly adhere to the SSS-Rank creative directives. Tag your raw feeds appropriately. NSFW content must be shielded behind CW (Content Warnings).</p>
              </section>
              <section>
                <h3 class="text-cyan-400 font-bold mb-2 uppercase tracking-wide text-xs">
                  III. Privacy &amp; The Matrix
                </h3>
                <p>We respect your encrypted data. Use our E2EE drop system responsibly. System administrators will never decrypt private datastreams without a core warrant.</p>
              </section>
              <section>
                <h3 class="text-cyan-400 font-bold mb-2 uppercase tracking-wide text-xs">
                  IV. Federal Obligations
                </h3>
                <p>As a node strictly connected to ActivityPub, you represent Asagity when federating with other servers. Keep the signal pure.</p>
              </section>
            </div>
          </div>
        </div>

        <div class="md:w-2/5 transition-colors md:bg-white/5 p-10 flex flex-col justify-center gap-5">
          <div class="text-center mb-6">
            <span class="text-2xl font-black block text-white drop-shadow-md tracking-wider">Join Context</span>
            <span class="text-xs font-bold text-gray-400">Initialize your Identity</span>
          </div>

          <NuxtLink
            to="/register"
            @click.stop
          >
            <button class="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-black tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(57,197,187,0.4)] hover:shadow-[0_0_30px_rgba(57,197,187,0.6)] transition-all transform hover:-translate-y-1 active:translate-y-0 text-sm">
              Create Account
            </button>
          </NuxtLink>

          <NuxtLink
            to="/login"
            @click.stop
          >
            <button class="w-full bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest py-3.5 rounded-2xl border border-white/10 transition-all text-sm">
              Login
            </button>
          </NuxtLink>

          <div class="flex items-center gap-3 my-2 opacity-50">
            <div class="h-px bg-white/20 flex-1" />
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">or</span>
            <div class="h-px bg-white/20 flex-1" />
          </div>

          <button
            type="button"
            class="w-full bg-transparent hover:bg-fuchsia-500/10 text-gray-400 hover:text-fuchsia-400 font-bold tracking-wider py-3 rounded-2xl border border-dashed border-gray-600 hover:border-fuchsia-500/50 transition-all text-xs flex items-center justify-center gap-2 group"
            @click.stop="handleDeveloperEnter"
          >
            <UIcon
              name="i-material-symbols-code-blocks-outline"
              class="w-4 h-4 group-hover:animate-pulse"
            />
            Direct Enter (Dev)
          </button>
        </div>
      </div>
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

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(57, 197, 187, 0.5);
  border-radius: 4px;
}
</style>