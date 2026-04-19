<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: '收藏' })
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-center">
      <UIcon
        name="i-material-symbols-star-outline"
        class="w-16 h-16 text-gray-400 mb-4"
      />
      <h2 class="text-2xl font-bold text-gray-600 dark:text-gray-300">
        收藏
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">
        您的收藏内容...
      </p>
    </div>
  </div>
</template>
