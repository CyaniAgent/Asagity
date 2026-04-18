<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: '图集' })
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-center">
      <UIcon
        name="i-material-symbols-photo-library"
        class="w-16 h-16 text-gray-400 mb-4"
      />
      <h2 class="text-2xl font-bold text-gray-600 dark:text-gray-300">
        图集
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">
        您的图片收藏...
      </p>
    </div>
  </div>
</template>
