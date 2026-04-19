<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: '开发者' })
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-center">
      <UIcon
        name="i-material-symbols-terminal"
        class="w-16 h-16 text-gray-400 mb-4"
      />
      <h2 class="text-2xl font-bold text-gray-600 dark:text-gray-300">
        开发者
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">
        API 文档和开发者工具...
      </p>
    </div>
  </div>
</template>
