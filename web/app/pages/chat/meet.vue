<template>
  <div class="flex flex-col items-center justify-center h-full p-8 text-center animate-[fade-in_0.3s_ease-out]">
    <div class="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
      <UIcon
        name="i-material-symbols-video-camera-front"
        class="w-12 h-12 text-cyan-500"
      />
    </div>
    <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-wide mb-2">
      Asagity Meet
    </h2>
    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
      这是专为跨次元打造的高清通讯空间！音视频通话功能正在开发中，您可以去期待一下哦！( •̀ ω •́ )✧
    </p>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Asagity Meet'
})
</script>
