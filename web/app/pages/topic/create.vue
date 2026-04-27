<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default'
})

const topicName = ref('')
const topicDescription = ref('')
const isPublic = ref(true)

const isSubmitting = ref(false)

async function handleSubmit() {
  if (!topicName.value.trim()) return

  isSubmitting.value = true

  // TODO: Call API to create topic
  console.log('Creating topic:', {
    name: topicName.value,
    description: topicDescription.value,
    isPublic: isPublic.value
  })

  setTimeout(() => {
    isSubmitting.value = false
    // Redirect to topic list
    navigateTo('/topic')
  }, 1000)
}
</script>

<template>
  <div class="max-w-[800px] mx-auto w-full animate-[fade-in_0.4s_ease-out]">
    <!-- Form -->
    <div class="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-[30px] border border-white/30 dark:border-gray-800/50 shadow-sm overflow-hidden">
      <div class="p-6 space-y-6">
        <!-- Topic Name -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
            话题名称 <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/30 dark:border-gray-700/50 focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50 transition-all overflow-hidden">
            <span class="pl-4 pr-2 py-3 text-gray-400 font-bold select-none">#</span>
            <input
              v-model="topicName"
              type="text"
              placeholder="输入话题名称"
              class="flex-1 py-3 pr-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            >
          </div>
          <p class="text-xs text-gray-400">
            话题名称只能包含字母、数字和下划线
          </p>
        </div>

        <!-- Topic Description -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
            话题描述
          </label>
          <textarea
            v-model="topicDescription"
            rows="4"
            placeholder="描述这个话题的内容..."
            class="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
          />
        </div>

        <!-- Visibility -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
            可见性
          </label>
          <div class="flex gap-3">
            <button
              class="flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all"
              :class="isPublic
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10'
                : 'border-white/30 dark:border-gray-700/50 hover:border-cyan-500/50'"
              @click="isPublic = true"
            >
              <UIcon
                name="i-material-symbols-public"
                class="w-5 h-5"
                :class="isPublic ? 'text-cyan-500' : 'text-gray-400'"
              />
              <div class="text-left">
                <span class="block font-bold text-sm text-gray-900 dark:text-white">公开</span>
                <span class="block text-xs text-gray-500">所有人都可以看见</span>
              </div>
            </button>
            <button
              class="flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all"
              :class="!isPublic
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10'
                : 'border-white/30 dark:border-gray-700/50 hover:border-cyan-500/50'"
              @click="isPublic = false"
            >
              <UIcon
                name="i-material-symbols-lock"
                class="w-5 h-5"
                :class="!isPublic ? 'text-cyan-500' : 'text-gray-400'"
              />
              <div class="text-left">
                <span class="block font-bold text-sm text-gray-900 dark:text-white">私有</span>
                <span class="block text-xs text-gray-500">仅关注者可见</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t border-white/20 dark:border-gray-800/50 flex items-center justify-end">
        <UButton
          label="创建话题"
          color="primary"
          class="rounded-full shadow-[0_0_15px_rgba(57,197,187,0.5)]"
          :loading="isSubmitting"
          :disabled="!topicName.trim()"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
