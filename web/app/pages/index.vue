<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- 欢迎区块 -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 backdrop-blur-md border border-cyan-500/20 p-8 shadow-sm">
      <div class="flex items-center justify-between z-10 relative">
        <div class="space-y-4">
          <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            欢迎回到 Asagity! <span class="animate-bounce">✨</span>
          </h1>
          <p class="text-gray-600 dark:text-gray-300">
            全维度二次元去中心化社交网络，这里是属于你的空间。
          </p>
          <div class="pt-2">
            <UButton
              label="立刻签到！"
              icon="i-lucide-sparkles"
              color="primary"
              variant="subtle"
            />
          </div>
        </div>
        <div class="hidden md:block">
          <div class="w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-400/40 to-blue-400/40 blur-3xl animate-pulse" />
        </div>
      </div>
    </div>

    <!-- 动态流骨架屏占位 -->
    <div class="space-y-4">
      <h2 class="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent w-max">
        本站最新动态
      </h2>
      <div
        v-for="i in 5"
        :key="i"
        class="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(57,197,187,0.1)] transition-all duration-300 cursor-pointer group"
      >
        <div class="flex items-center gap-3 mb-4">
          <USkeleton class="h-10 w-10 rounded-full" />
          <div class="space-y-2">
            <USkeleton class="h-4 w-[150px]" />
            <USkeleton class="h-3 w-[100px]" />
          </div>
        </div>
        <div class="space-y-3">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-[90%]" />
          <USkeleton class="h-4 w-[60%]" />
        </div>
        <div class="flex items-center gap-4 mt-6 opacity-60 group-hover:opacity-100 transition-opacity">
          <USkeleton class="h-4 w-12" />
          <USkeleton class="h-4 w-12" />
        </div>
      </div>
    </div>
  </div>
</template>
