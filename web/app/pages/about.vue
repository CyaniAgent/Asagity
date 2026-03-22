<script setup lang="ts">
import { useInstanceStore } from '@/stores/instance'

const instanceStore = useInstanceStore()
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-10">
      <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
      <div
        class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-400 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
        style="animation-delay: 2s;"
      />
    </div>

    <!-- 玻璃态主卡片 -->
    <div class="z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl px-12 py-16 rounded-[40px] border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(34,211,238,0.1)] flex flex-col items-center max-w-2xl text-center">
      <!-- 动态 Logo 容器 -->
      <div class="relative group mb-8">
        <div class="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-primary-600 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <div class="relative w-32 h-32 bg-gradient-to-br from-cyan-400 to-primary-600 rounded-[32px] flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-white/50 dark:ring-white/10 transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
          <img
            v-if="instanceStore.logoURL"
            :src="instanceStore.logoURL"
            class="w-full h-full object-cover"
          >
          <UIcon
            v-else
            name="i-lucide-zap"
            class="w-16 h-16 text-white"
          />
        </div>
      </div>

      <!-- 实例名称与别名 -->
      <h1 class="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight drop-shadow-sm">
        {{ instanceStore.name }}
      </h1>
      <div class="inline-flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-1.5 rounded-full mb-8 border border-white/20 dark:border-white/5">
        <UIcon
          name="i-lucide-at-sign"
          class="w-4 h-4 text-cyan-500"
        />
        <span class="text-sm font-bold text-gray-600 dark:text-gray-400 tracking-wider">
          {{ instanceStore.alias }}
        </span>
      </div>

      <!-- 描述引言 -->
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-10 leading-relaxed font-medium">
        <span class="font-black text-cyan-600 dark:text-cyan-400">「{{ instanceStore.name }}」</span> 使用 Asagity，是使用 ActivityPub 与自研通信协议的去中心化开源平台。
      </p>

      <!-- 实例详细描述块 -->
      <div class="bg-gray-100/50 dark:bg-gray-800/50 rounded-[24px] p-6 mb-10 w-full text-left border border-white/30 dark:border-white/5 shadow-inner">
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {{ instanceStore.description }}
        </p>
      </div>

      <!-- 版本号标注 -->
      <div class="flex items-center gap-2 group cursor-default">
        <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <span class="text-xs font-black text-gray-400 dark:text-gray-600 tracking-[0.2em] group-hover:text-cyan-500 transition-colors">
          {{ instanceStore.version }}
        </span>
      </div>
    </div>
  </div>
</template>
