<script setup lang="ts">
const instanceInfo = {
  name: 'Asagity Instance',
  version: '1.0.0-beta.39',
  description: 'A multi-dimensional social space for divine engineers.',
  maintainer: 'YunaAyase',
  foundedAt: '2026-03-21',
  activeUsers: 1240,
  totalPosts: 85420
}
</script>

<template>
  <div class="space-y-8 animate-[fade-in_0.5s_ease-out]">
    <!-- Section Header -->
    <div class="space-y-1">
      <h2 class="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <UIcon name="i-material-symbols-info" class="text-cyan-500" />
        实例基础信息
      </h2>
      <p class="text-sm text-gray-500">查看并修改当前实例的公开标识与运行状态</p>
    </div>

    <!-- Info Cards Grid -->
    <div class="grid grid-cols-2 gap-4">
      <div class="p-5 rounded-3xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm space-y-3 hover:border-cyan-500/30 transition-colors group">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instance Name</span>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ instanceInfo.name }}</span>
          <UButton icon="i-material-symbols-edit-outline" variant="ghost" color="neutral" size="xs" />
        </div>
      </div>

      <div class="p-5 rounded-3xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm space-y-3 hover:border-cyan-500/30 transition-colors group">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Version Status</span>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ instanceInfo.version }}</span>
          <span class="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20">STABLE</span>
        </div>
      </div>
    </div>

    <!-- Description Area -->
    <div class="p-6 rounded-[32px] bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instance Description</span>
        <UButton label="更新描述" variant="soft" color="primary" size="sm" />
      </div>
      <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{{ instanceInfo.description }}</p>
    </div>

    <!-- Stats Row -->
    <div class="flex gap-4">
      <div class="flex-1 p-5 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 flex flex-col items-center gap-1">
        <span class="text-2xl font-black text-cyan-600 dark:text-cyan-400">{{ instanceInfo.activeUsers }}</span>
        <span class="text-[10px] font-bold text-gray-500 uppercase">活跃用户</span>
      </div>
      <div class="flex-1 p-5 rounded-3xl bg-fuchsia-500/5 border border-fuchsia-500/10 flex flex-col items-center gap-1">
        <span class="text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">{{ instanceInfo.totalPosts }}</span>
        <span class="text-[10px] font-bold text-gray-500 uppercase">总帖子数</span>
      </div>
      <div class="flex-1 p-5 rounded-3xl bg-orange-500/5 border border-orange-500/10 flex flex-col items-center gap-1">
        <span class="text-2xl font-black text-orange-600 dark:text-orange-400">{{ instanceInfo.foundedAt }}</span>
        <span class="text-[10px] font-bold text-gray-500 uppercase">建立日期</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>
