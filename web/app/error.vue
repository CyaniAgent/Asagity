<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const handleError = () => clearError({ redirect: '/' })

const errorMessage = computed(() => {
  if (props.error.statusCode === 404) {
    return '该页面不存在，请联系实例管理员或稍后重试'
  }
  return props.error.message || '发生了一些错误，请稍后重试'
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] px-4 overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-cyan-400/10 rounded-full blur-[120px] animate-pulse" />
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
      <!-- 404 Image -->
      <div class="mb-8">
        <img
          src="/images/system/404.png"
          alt="404 Not Found"
          class="w-64 h-64 object-contain"
          @error="(e: Event) => { (e.target as HTMLImageElement).style.display = 'none' }"
        >
      </div>

      <!-- Error Code -->
      <h1 class="text-[32px] font-black text-gray-900 dark:text-white tracking-tight mb-4">
        404 Not Found
      </h1>

      <!-- Error Message -->
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        {{ errorMessage }}
      </p>

      <!-- Return Button -->
      <button
        class="group relative overflow-hidden rounded-full px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-900 font-black tracking-wider shadow-[0_0_20px_rgba(57,197,187,0.4)] hover:shadow-[0_0_30px_rgba(57,197,187,0.6)] transition-all hover:-translate-y-0.5 active:translate-y-0"
        @click="handleError"
      >
        <span class="relative z-10 flex items-center gap-2">
          <UIcon
            name="i-material-symbols-home-rounded"
            class="w-5 h-5"
          />
          返回本实例
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
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
</style>
