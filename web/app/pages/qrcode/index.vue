<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: '多维码' })
</script>
<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-center">
      <UIcon name="i-material-symbols-qr-code" class="w-16 h-16 text-gray-400 mb-4" />
      <h2 class="text-2xl font-bold text-gray-600 dark:text-gray-300">多维码</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">生成和扫描二维码...</p>
    </div>
  </div>
</template>
