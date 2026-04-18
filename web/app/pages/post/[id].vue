<script setup lang="ts">
const route = useRoute()
const postId = computed(() => route.params.id)

useHead({
  title: `帖子 #${postId.value}`
})
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-center">
      <UIcon
        name="i-material-symbols-article"
        class="w-16 h-16 text-gray-400 mb-4"
      />
      <h2 class="text-2xl font-bold text-gray-600 dark:text-gray-300">
        帖子 #{{ postId }}
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">
        帖子详情页正在开发中...
      </p>
    </div>
  </div>
</template>
