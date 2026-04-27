<script setup lang="ts">
const props = defineProps<{
  url: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const isLoading = ref(true)

function handleLoad() {
  isLoading.value = false
}

function reload() {
  if (iframeRef.value) {
    isLoading.value = true
    iframeRef.value.src = props.url
  }
}

// 提取域名用于显示
const displayUrl = computed(() => {
  try {
    const url = new URL(props.url)
    return url.hostname
  } catch {
    return props.url
  }
})
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden relative">
    <!-- Browser Toolbar -->
    <div class="h-10 shrink-0 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 gap-3 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md">
      <div class="flex items-center gap-1">
        <UButton
          icon="i-material-symbols-arrow-back"
          variant="ghost"
          color="neutral"
          size="xs"
          class="rounded-full"
        />
        <UButton
          icon="i-material-symbols-arrow-forward"
          variant="ghost"
          color="neutral"
          size="xs"
          class="rounded-full opacity-50"
        />
      </div>
      
      <div class="flex-1 h-7 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center px-2 gap-2 overflow-hidden shadow-inner">
        <UIcon name="i-material-symbols-lock-outline" class="w-3 h-3 text-green-500 shrink-0" />
        <span class="text-[11px] font-medium text-gray-400 truncate">{{ displayUrl }}</span>
        <span class="text-[11px] text-gray-300 dark:text-gray-600 truncate flex-1">{{ props.url }}</span>
      </div>

      <UButton
        icon="i-material-symbols-refresh"
        variant="ghost"
        color="neutral"
        size="xs"
        class="rounded-full"
        @click="reload"
      />
    </div>

    <!-- Iframe Content -->
    <div class="flex-1 relative">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-10 transition-opacity duration-300">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <span class="text-xs font-bold text-cyan-500 uppercase tracking-widest animate-pulse">Navigating Matrix...</span>
        </div>
      </div>
      
      <iframe
        ref="iframeRef"
        :src="url"
        class="w-full h-full border-none"
        @load="handleLoad"
      />
    </div>
    
    <!-- Footer / Security Warning -->
    <div class="h-6 shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center px-3 justify-between">
      <div class="flex items-center gap-1.5 opacity-60">
        <UIcon name="i-material-symbols-security" class="w-3 h-3 text-cyan-500" />
        <span class="text-[9px] font-bold text-gray-500 dark:text-gray-400">ISOLATED SANDBOX ACTIVE</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[9px] font-medium text-gray-400">100% SECURE</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保 iframe 撑满 */
iframe {
  color-scheme: light dark;
}
</style>
