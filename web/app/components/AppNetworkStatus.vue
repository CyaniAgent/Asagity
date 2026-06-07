<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSystemStore } from '~/stores/system'
import { useFreeWindowStore } from '~/stores/freeWindow'
import { useUserStore } from '~/stores/user'

const route = useRoute()
const systemStore = useSystemStore()
const userStore = useUserStore()

// If we are on the root page AND not logged in, we consider it the Welcome/Login/Register page
const isWelcomePage = computed(() => {
  return route.path === '/' && !userStore.isLoggedIn
})

const isOffline = computed(() => !systemStore.isBackendOnline && systemStore.hasLaunched && !systemStore.isDevMode)

// Easter egg logic
const clickCount = ref(0)
let clickTimer: ReturnType<typeof setTimeout> | null = null

const handleToastClick = () => {
  clickCount.value++
  
  if (clickTimer) clearTimeout(clickTimer)
  
  if (clickCount.value >= 10) {
    clickCount.value = 0
    const freeWindowStore = useFreeWindowStore()
    freeWindowStore.openTermity()
  } else {
    // Reset counter if they stop clicking for 1 second
    clickTimer = setTimeout(() => {
      clickCount.value = 0
    }, 1000)
  }
}
</script>

<template>
  <Transition :name="isWelcomePage ? 'fade-slide-top' : 'fade-slide-bottom'">
    <div v-if="isOffline"
      class="fixed z-[100002] pointer-events-none w-full flex justify-center transition-all duration-500 ease-out"
      :class="isWelcomePage ? 'top-10' : 'bottom-10'">
      <div
        class="bg-black/90 backdrop-blur-xl border-2 border-red-500/80 rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-start gap-4 mx-4 max-w-xl pointer-events-auto select-none"
        @click="handleToastClick">
        <UIcon name="i-material-symbols-wifi-off-rounded" class="w-8 h-8 text-red-500 shrink-0 mt-0.5 animate-pulse" />
        <div class="flex flex-col gap-1.5 pt-0.5">
          <span v-if="isWelcomePage" class="font-medium text-red-100 text-sm drop-shadow-sm">
            Asagity NET 连接失败，目前无法提供任何在线服务（包括登录）
          </span>
          <span v-else class="font-medium text-red-100 text-sm drop-shadow-sm">
            Asagity NET 连接失败，目前无法提供任何在线服务
          </span>

          <span v-if="isWelcomePage" class="text-xs text-red-400 font-normal leading-relaxed">
            请联系实例运营人员或稍后刷新重试
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-slide-top-enter-active,
.fade-slide-top-leave-active,
.fade-slide-bottom-enter-active,
.fade-slide-bottom-leave-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-slide-top-enter-from,
.fade-slide-top-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.fade-slide-bottom-enter-from,
.fade-slide-bottom-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}
</style>
