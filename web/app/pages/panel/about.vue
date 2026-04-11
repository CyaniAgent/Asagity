<script setup lang="ts">
import { computed } from 'vue'
import { useFreeWindowStore } from '@/stores/freeWindow'

definePageMeta({
  layout: 'default'
})

const freeWindowStore = useFreeWindowStore()
const config = useRuntimeConfig()

interface InstanceSetting {
  ID: number
  Key: string
  Value: string
  Description: string
}

interface DatabaseStat {
  table: string
  size_pretty: string
  size_bytes: number
  rows: number
}

// 1. 获取实例详细设置 (Go API)
const { data: instanceSettings, pending: pendingInstance } = useAsyncData<InstanceSetting[]>('admin-instance-settings', () => $fetch('/api/admin/system/instance', {
  baseURL: config.public.apiBase
}))

// 2. 获取数据库占用 (Go API)
const { data: dbStats, pending: pendingDB } = useAsyncData<DatabaseStat[]>('admin-db-stats', () => $fetch('/api/admin/system/database', {
  baseURL: config.public.apiBase
}))

// 3. 获取运行环境 (Go API)
const { data: envInfo, pending: pendingEnv } = useAsyncData<{
  hostname: string
  platform: string
  os_version: string
  arch: string
  cpu: string
  memory: string
  is_container: boolean
}>('system-env', () => $fetch('/api/system/environment', {
  baseURL: config.public.apiBase
}))

const topTables = computed(() => {
  if (!dbStats.value) return []
  return dbStats.value.slice(0, 5)
})

const maxTableSize = computed(() => {
  if (!dbStats.value || dbStats.value.length === 0) return 1
  return dbStats.value[0].size_bytes
})

function openDatabaseDetails() {
  freeWindowStore.openFromContext('admin_database', {}, {})
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
        <UIcon
          name="i-material-symbols-info-outline"
          class="w-6 h-6 text-cyan-600 dark:text-cyan-400"
        />
      </div>
      <div>
        <h1 class="text-2xl font-black text-gray-900 dark:text-white">
          关于 Asagity
        </h1>
        <p class="text-sm text-gray-500">
          实例运维状况与系统探针
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 实例详细信息 -->
      <UCard
        class="overflow-hidden"
        :ui="{ body: { padding: 'p-0' } }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-material-symbols-settings-suggest"
              class="text-cyan-500"
            />
            <span class="font-bold">实例详细信息</span>
          </div>
        </template>

        <div
          v-if="pendingInstance"
          class="p-8 flex justify-center"
        >
          <UIcon
            name="i-material-symbols-progress-activity"
            class="animate-spin text-cyan-500 w-6 h-6"
          />
        </div>
        <div
          v-else
          class="divide-y divide-gray-100 dark:divide-gray-800"
        >
          <div
            v-for="setting in instanceSettings || []"
            :key="setting.ID"
            class="px-4 py-3 flex items-start justify-between group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <div class="flex flex-col">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-tight">{{ setting.Key }}</span>
              <span class="text-sm text-gray-900 dark:text-gray-200 font-medium">{{ setting.Description || '无说明' }}</span>
            </div>
            <div class="max-w-[180px] text-right">
              <span class="text-sm font-mono text-cyan-600 dark:text-cyan-400 break-all">{{ setting.Value || '(Empty)' }}</span>
            </div>
          </div>
          <div
            v-if="!instanceSettings || instanceSettings.length === 0"
            class="p-8 text-center text-sm text-gray-500"
          >
            暂无实例配置项
          </div>
        </div>
      </UCard>

      <div class="space-y-6">
        <!-- 数据库状况 -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-material-symbols-database"
                  class="text-cyan-500"
                />
                <span class="font-bold">数据库详情 (Top 5)</span>
              </div>
              <UButton
                color="cyan"
                variant="ghost"
                size="xs"
                icon="i-material-symbols-open-in-new"
                @click="openDatabaseDetails"
              >
                全部记录
              </UButton>
            </div>
          </template>

          <div
            v-if="pendingDB"
            class="py-4 flex justify-center"
          >
            <UIcon
              name="i-material-symbols-progress-activity"
              class="animate-spin text-cyan-500 w-6 h-6"
            />
          </div>
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="table in topTables"
              :key="table.table"
              class="space-y-1.5"
            >
              <div class="flex justify-between text-xs">
                <span class="font-mono font-bold text-gray-700 dark:text-gray-300">{{ table.table }}</span>
                <span class="text-gray-500">{{ table.size_pretty }}</span>
              </div>
              <UProgress
                :value="(table.size_bytes / maxTableSize) * 100"
                color="cyan"
                size="sm"
              />
            </div>
            <div
              v-if="!topTables || topTables.length === 0"
              class="text-center text-sm text-gray-500 py-4"
            >
              未检测到数据库占用信息
            </div>
          </div>
        </UCard>

        <!-- 运行环境 -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-material-symbols-terminal"
                class="text-cyan-500"
              />
              <span class="font-bold">运行环境</span>
            </div>
          </template>

          <div
            v-if="pendingEnv"
            class="py-4 flex justify-center"
          >
            <UIcon
              name="i-material-symbols-progress-activity"
              class="animate-spin text-cyan-500 w-6 h-6"
            />
          </div>
          <div
            v-else-if="envInfo"
            class="grid grid-cols-2 gap-4"
          >
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                宿主机名
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ envInfo.hostname }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                操作系统
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ envInfo.platform }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                系统架构
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ envInfo.arch }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                CPU
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ envInfo.cpu || 'Unknown' }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                内存
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ envInfo.memory || 'Unknown' }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                容器环境
              </p>
              <p class="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                {{ envInfo.is_container ? '是' : '否' }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
