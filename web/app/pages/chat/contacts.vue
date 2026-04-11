<template>
  <div class="flex flex-col items-center justify-center h-full p-8 text-center animate-[fade-in_0.3s_ease-out]">
    <div class="w-24 h-24 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
      <UIcon
        name="i-material-symbols-contacts"
        class="w-12 h-12 text-cyan-500"
      />
    </div>
    <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-wide mb-2">
      通讯录
    </h2>
    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
      这里将展示您的所有联系人与群组。好友系统正在施工中，敬请期待！( •̀ ω •́ )✧
    </p>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '通讯录'
})
</script>
