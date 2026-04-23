<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFreeWindowStore } from '@/stores/freeWindow'
import { useSystemStore } from '~/stores/system'
import { useAppToast } from '~/composables/useAppToast'

definePageMeta({
  layout: 'default'
})

const freeWindowStore = useFreeWindowStore()
const config = useRuntimeConfig()
const systemStore = useSystemStore()
const toast = useAppToast()

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

const instanceError = ref(false)
const dbError = ref(false)
const envError = ref(false)

// Dev mode check - show warning and skip API calls
if (systemStore.isDevMode) {
  toast.add({
    title: '开发模式无法操作此功能',
    description: '该功能需要依赖真实服务端使用，无法进行测试',
    color: 'warning',
    icon: 'i-material-symbols-terminal'
  })
}

const fetchInstanceSettings = async () => {
  try {
    instanceError.value = false
    const result = await $fetch<InstanceSetting[]>('/api/admin/system/instance', {
      baseURL: config.public.apiBase
    })
    instanceSettings.value = result
  } catch {
    instanceError.value = true
  }
}

const fetchDbStats = async () => {
  try {
    dbError.value = false
    const result = await $fetch<DatabaseStat[]>('/api/admin/system/database', {
      baseURL: config.public.apiBase
    })
    dbStatsValue.value = result
  } catch {
    dbError.value = true
  }
}

const fetchEnvInfo = async () => {
  try {
    envError.value = false
    const result = await $fetch<{
      hostname: string
      platform: string
      os_version: string
      arch: string
      cpu: string
      memory: string
      is_container: boolean
    }>('/api/system/environment', {
      baseURL: config.public.apiBase
    })
    envInfoValue.value = result
  } catch {
    envError.value = true
  }
}

const instanceSettings = ref<InstanceSetting[] | null>(null)
const dbStatsValue = ref<DatabaseStat[] | null>(null)
const envInfoValue = ref<{
  hostname: string
  platform: string
  os_version: string
  arch: string
  cpu: string
  memory: string
  is_container: boolean
} | null>(null)

const pendingInstance = ref(false)
const pendingDB = ref(false)
const pendingEnv = ref(false)

const refreshInstance = () => fetchInstanceSettings()
const refreshDB = () => fetchDbStats()
const refreshEnv = () => fetchEnvInfo()

fetchInstanceSettings()
fetchDbStats()
fetchEnvInfo()

const topTables = computed(() => {
  if (!dbStatsValue.value) return []
  return dbStatsValue.value.slice(0, 5)
})

const maxTableSize = computed(() => {
  if (!dbStatsValue.value || dbStatsValue.value.length === 0) return 1
  return dbStatsValue.value[0]?.size_bytes ?? 1
})

function openDatabaseDetails() {
  freeWindowStore.openFromContext('admin_database', {}, {})
}

function retryAll() {
  instanceError.value = false
  dbError.value = false
  envError.value = false
  refreshInstance()
  refreshDB()
  refreshEnv()
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 animate-[fade-in_0.4s_ease-out]">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 实例详细信息 -->
      <UCard class="overflow-hidden">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-material-symbols-settings-suggest"
                class="text-cyan-500"
              />
              <span class="font-bold">实例详细信息</span>
            </div>
            <UButton
              v-if="instanceError"
              color="error"
              variant="ghost"
              size="xs"
              icon="i-material-symbols-refresh"
              @click="refreshInstance(); instanceError = false"
            />
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
          v-else-if="instanceError"
          class="p-8 flex flex-col items-center gap-3 text-center"
        >
          <UIcon
            name="i-material-symbols-cloud-off"
            class="w-10 h-10 text-red-400"
          />
          <p class="text-sm text-gray-500">
            无法连接到后端服务
          </p>
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
              <div class="flex items-center gap-2">
                <UButton
                  v-if="dbError"
                  color="error"
                  variant="ghost"
                  size="xs"
                  icon="i-material-symbols-refresh"
                  @click="refreshDB(); dbError = false"
                />
                <UButton
                  color="primary"
                  variant="ghost"
                  size="xs"
                  icon="i-material-symbols-open-in-new"
                  @click="openDatabaseDetails"
                >
                  全部记录
                </UButton>
              </div>
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
            v-else-if="dbError"
            class="p-6 flex flex-col items-center gap-3 text-center"
          >
            <UIcon
              name="i-material-symbols-cloud-off"
              class="w-10 h-10 text-red-400"
            />
            <p class="text-sm text-gray-500">
              无法连接到数据库服务
            </p>
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
                color="primary"
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
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-material-symbols-terminal"
                  class="text-cyan-500"
                />
                <span class="font-bold">运行环境</span>
              </div>
              <UButton
                v-if="envError"
                color="error"
                variant="ghost"
                size="xs"
                icon="i-material-symbols-refresh"
                @click="refreshEnv(); envError = false"
              />
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
            v-else-if="envError"
            class="p-6 flex flex-col items-center gap-3 text-center"
          >
            <UIcon
              name="i-material-symbols-cloud-off"
              class="w-10 h-10 text-red-400"
            />
            <p class="text-sm text-gray-500">
              无法获取运行环境信息
            </p>
          </div>
          <div
            v-else-if="envInfoValue"
            class="grid grid-cols-2 gap-4"
          >
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                宿主机名
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ envInfoValue.hostname }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                操作系统
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ envInfoValue.platform }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                系统架构
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ envInfoValue.arch }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                CPU
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ envInfoValue.cpu || 'Unknown' }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                内存
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ envInfoValue.memory || 'Unknown' }}
              </p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <p class="text-[10px] font-bold text-gray-400 uppercase">
                容器环境
              </p>
              <p class="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                {{ envInfoValue.is_container ? '是' : '否' }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
