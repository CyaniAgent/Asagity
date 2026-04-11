<script setup lang="ts">
const config = useRuntimeConfig()

interface DatabaseStat {
  table: string
  size_pretty: string
  size_bytes: number
  rows: number
}

const { data: stats, pending, error } = useAsyncData<DatabaseStat[]>('admin-db-details', () => $fetch('/api/admin/system/database', {
  baseURL: config.public.apiBase
}))
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <div
      v-if="pending"
      class="flex flex-col items-center justify-center h-full gap-4"
    >
      <UIcon
        name="i-material-symbols-progress-activity"
        class="w-8 h-8 animate-spin text-cyan-500"
      />
      <span class="text-sm text-gray-500 dark:text-gray-400">正在扫描数据库表...</span>
    </div>

    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center h-full gap-4 text-red-500"
    >
      <UIcon
        name="i-material-symbols-error-outline"
        class="w-12 h-12"
      />
      <span class="text-sm font-medium">获取数据库详情失败</span>
      <span class="text-xs opacity-75">{{ error.message }}</span>
    </div>

    <div
      v-else-if="stats"
      class="h-full flex flex-col gap-4"
    >
      <div class="flex items-center gap-2 mb-2">
        <UIcon
          name="i-material-symbols-database"
          class="w-6 h-6 text-cyan-600 dark:text-cyan-400"
        />
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          数据库完整占用分析
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
        <table class="w-full text-left border-collapse">
          <thead class="sticky top-0 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md z-10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                表名
              </th>
              <th class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                预估行数
              </th>
              <th class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-right">
                占用大小 (Bytes)
              </th>
              <th class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-right">
                易读大小
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <tr
              v-for="table in stats || []"
              :key="table.table"
              class="hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
            >
              <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-200">
                {{ table.table }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {{ table.rows.toLocaleString() }} 行
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-right font-mono">
                {{ table.size_bytes.toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-400 text-right">
                {{ table.size_pretty }}
              </td>
            </tr>
            <tr v-if="!stats || stats.length === 0">
              <td
                colspan="4"
                class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                暂无数据表或无权访问
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
