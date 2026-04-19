<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
      <UIcon
        :name="icon || 'i-material-symbols-inbox'"
        class="w-10 h-10 text-gray-300 dark:text-gray-600"
      />
    </div>
    <h3 class="text-lg font-black text-gray-500 dark:text-gray-400 mb-2">
      {{ title || '暂无内容' }}
    </h3>
    <p class="text-sm text-gray-400 dark:text-gray-500 max-w-[200px]">
      {{ description || '这里是空的，快去发现一些有趣的内容吧！' }}
    </p>
    <slot />
  </div>
</template>
