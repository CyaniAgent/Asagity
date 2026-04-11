<script setup lang="ts">
import { ref, computed } from 'vue'

const isDropping = ref(false)

// 1. Radar & Spatial Logic
// Simulate discovered devices. We calculate angle and radius.
// Devices owned by the user can orbit closer (radius 160). Public peers orbit further (radius 280).
interface PeerNode {
  id: string
  displayName: string
  username: string
  system: string
  avatar: string
  isSelf?: boolean
  radius: number
  angle: number // degrees
}

const discoveredNodes = ref<PeerNode[]>([
  { id: '1', displayName: '绝对领域SK', username: 'syskuku', system: 'iPhone', avatar: 'https://avatars.githubusercontent.com/u/739984?v=4', isSelf: true, radius: 180, angle: -45 },
  { id: '2', displayName: 'Yuna', username: 'yuna_ayase', system: 'macOS', avatar: 'https://avatars.githubusercontent.com/u/10?v=4', radius: 320, angle: 60 },
  { id: '3', displayName: '静流', username: 'shizuru_official', system: 'Android', avatar: 'https://avatars.githubusercontent.com/u/11?v=4', radius: 320, angle: 160 }
])

// 2. Transferred Tasks Management (Floating Bottom Queue)
type TransferState = 'active' | 'paused' | 'completed' | 'error' | 'waiting'

interface DropTask {
  id: string
  fileName: string
  fileSize: string
  progress: number
  speed: string
  direction: 'send' | 'receive'
  state: TransferState
  targetUserName: string
  targetAvatar: string
}

const activeTasks = ref<DropTask[]>([
  {
    id: 't-1',
    fileName: 'Asagity_Project_Design_Final_v2.psd',
    fileSize: '412 MB',
    progress: 72,
    speed: '24.1 MB/s',
    direction: 'send',
    state: 'active',
    targetUserName: 'syskuku',
    targetAvatar: 'https://avatars.githubusercontent.com/u/739984?v=4'
  },
  {
    id: 't-2',
    fileName: 'Vocaloid_Stem_Tracks_Miku.zip',
    fileSize: '1.2 GB',
    progress: 32,
    speed: '0 KB/s',
    direction: 'receive',
    state: 'paused',
    targetUserName: 'shizuru_official',
    targetAvatar: 'https://avatars.githubusercontent.com/u/11?v=4'
  }
])

const toggleTaskPause = (taskId: string) => {
  const task = activeTasks.value.find(t => t.id === taskId)
  if (!task) return
  if (task.state === 'active') {
    task.state = 'paused'
    task.speed = '0 KB/s'
  } else if (task.state === 'paused') {
    task.state = 'active'
    task.speed = '22.5 MB/s'
  }
}

// Global Drag Handlers
const onDragOver = () => { isDropping.value = true }
const onDragLeave = () => { isDropping.value = false }
const onDrop = () => {
  isDropping.value = false
  // Launch transfer logic to the target here
}

const queueExpanded = ref(true)
</script>

<template>
  <div
    class="fixed inset-0 top-[64px] z-0 overflow-hidden bg-white/50 dark:bg-gray-900/40 backdrop-blur-[2px] transition-colors duration-500"
    :class="{ '!bg-gray-900/60 dark:!bg-black/60': isDropping }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Global Drop Indication Overlay -->
    <div
      v-show="isDropping"
      class="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
    >
      <h2 class="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(57,197,187,0.8)] tracking-widest animate-[pulse_1.5s_ease-in-out_infinite]">
        DROP TO SEND
      </h2>
    </div>

    <!-- Center Coordinate System: Radar Rings -->
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none z-0">
      <!-- Inner Ring (Self Devices) -->
      <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-cyan-500/20 dark:border-cyan-400/10 shadow-[inset_0_0_40px_rgba(57,197,187,0.05)]"
        :class="{ 'border-cyan-400/60 scale-[1.02] shadow-[0_0_50px_rgba(57,197,187,0.2)] dark:shadow-[inset_0_0_60px_rgba(57,197,187,0.15)]': isDropping }"
      />
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-cyan-600/40 dark:text-cyan-400/40 font-bold -mt-[180px] bg-white/50 dark:bg-gray-900/50 px-2 rounded-full backdrop-blur-sm">
        My Devices
      </div>

      <!-- Outer Ring (Public Instance Devices) -->
      <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full border border-gray-300/50 dark:border-gray-700/50"
        :class="{ 'border-cyan-800/60 scale-[1.01]': isDropping }"
      />
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-gray-500/40 dark:text-gray-400/40 font-bold -mt-[320px] bg-white/50 dark:bg-gray-900/50 px-2 rounded-full backdrop-blur-sm">
        Nearby / Instance
      </div>

      <!-- Pulsing Wave (Radar Sweep Animation) -->
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full border-2 border-cyan-400/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
    </div>

    <!-- Central Node (Sun) -->
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] z-20 flex flex-col items-center group">
      <div class="relative flex items-center justify-center">
        <!-- Glow backing -->
        <div class="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/40 transition-colors" />
        <UAvatar
          src="https://avatars.githubusercontent.com/u/739984?v=4"
          size="3xl"
          class="ring-4 ring-cyan-500 bg-white relative z-10 shadow-lg shadow-cyan-500/30"
        />
        <div class="absolute -bottom-1 -right-1 z-20 bg-gray-900 border border-gray-700 rounded-full p-1 shadow-md">
          <UIcon
            name="i-simple-icons-windows11"
            class="w-4 h-4 text-white"
          />
        </div>
      </div>
      <div class="mt-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/50 dark:border-gray-700/50 flex flex-col items-center">
        <span class="text-sm font-black text-gray-900 dark:text-white leading-tight">Windows Desktop</span>
        <span class="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 tracking-wider">This Device • E2EE <UIcon
          name="i-material-symbols-lock"
          class="w-2.5 h-2.5 inline align-text-top"
        /></span>
      </div>
    </div>

    <!-- Orbiters (Planets) -->
    <div class="absolute left-1/2 top-1/2 z-20 w-0 h-0 -translate-y-[60%] pointer-events-none">
      <div
        v-for="peer in discoveredNodes"
        :key="peer.id"
        class="absolute pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group"
        :style="{
          transform: `rotate(${peer.angle}deg) translateX(${peer.radius}px) rotate(-${peer.angle}deg)`,
          left: 0,
          top: 0
        }"
      >
        <div
          class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer
                    hover:scale-110 active:scale-95 transition-transform"
        >
          <!-- Drop Hover Halo -->
          <div class="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 pointer-events-none" />

          <UAvatar
            :src="peer.avatar"
            :size="peer.isSelf ? 'xl' : 'lg'"
            class="shadow-[0_4px_15px_rgba(0,0,0,0.1)] transition-all"
            :class="peer.isSelf ? 'ring-2 ring-cyan-400/50' : 'ring-2 ring-white dark:ring-gray-700'"
          />

          <div class="absolute -bottom-1 -right-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-0.5 shadow-sm">
            <UIcon
              :name="peer.system === 'iPhone' ? 'i-simple-icons-apple' : peer.system === 'macOS' ? 'i-simple-icons-apple' : 'i-simple-icons-android'"
              class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
            />
          </div>

          <div
            class="mt-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl px-3 py-1 rounded-xl shadow-lg border border-white/50 dark:border-gray-700/50 flex flex-col items-center text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            :class="{ 'opacity-100': isDropping }"
          >
            <span class="text-xs font-black text-gray-900 dark:text-white">{{ peer.displayName }}</span>
            <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400">{{ peer.system }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Task Manager (Bottom Drawer) -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[600px] flex flex-col justify-end pointer-events-none">
      <div
        class="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-gray-700/50 shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden pointer-events-auto transition-all duration-500"
        :class="queueExpanded ? 'max-h-[400px]' : 'max-h-[64px]'"
      >
        <!-- Header / Toggle -->
        <div
          class="h-16 px-6 cursor-pointer flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          @click="queueExpanded = !queueExpanded"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
              <UIcon
                name="i-material-symbols-sync-alt"
                class="w-4 h-4 text-cyan-600 dark:text-cyan-400"
                :class="activeTasks.some(t => t.state === 'active') ? 'animate-spin' : ''"
              />
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-black text-gray-900 dark:text-white">Active Transfers</span>
              <span class="text-[10px] font-bold text-cyan-500 tracking-wide">{{ activeTasks.filter(t => t.state === 'active').length }} Ongoing • {{ activeTasks.filter(t => t.state === 'paused').length }} Paused</span>
            </div>
          </div>
          <UButton
            :icon="queueExpanded ? 'i-material-symbols-keyboard-arrow-down' : 'i-material-symbols-keyboard-arrow-up'"
            color="neutral"
            variant="ghost"
            class="rounded-full pointer-events-none"
          />
        </div>

        <!-- Task List Body -->
        <div class="px-3 pb-3 custom-scrollbar flex flex-col gap-2 relative">
          <div
            v-for="task in activeTasks"
            :key="task.id"
            class="bg-white/90 dark:bg-gray-800/90 rounded-[20px] p-3 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-1 relative overflow-hidden group"
          >
            <div
              v-if="task.state === 'active' || task.state === 'paused'"
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-50/50 dark:from-cyan-900/10 to-transparent transition-all duration-300"
              :style="{ width: `${task.progress}%` }"
            />

            <div class="relative z-10 flex gap-4 items-center">
              <div class="relative shrink-0">
                <UAvatar
                  :src="task.targetAvatar"
                  size="md"
                />
                <div
                  class="absolute -bottom-1 -right-1 rounded-full p-0.5"
                  :class="task.direction === 'send' ? 'bg-cyan-500 text-white' : 'bg-primary-500 text-white'"
                >
                  <UIcon
                    :name="task.direction === 'send' ? 'i-material-symbols-upload' : 'i-material-symbols-download'"
                    class="w-3 h-3"
                  />
                </div>
              </div>

              <div class="flex-1 min-w-0 pr-8">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span
                    class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate w-[150px] md:w-[200px]"
                    :title="task.fileName"
                  >{{ task.fileName }}</span>
                  <span
                    v-if="task.state === 'paused'"
                    class="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 rounded-full"
                  >Paused</span>
                  <span
                    v-else
                    class="text-[11px] font-bold text-cyan-600 dark:text-cyan-400"
                  >{{ task.speed }}</span>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex-1 h-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="task.state === 'paused' ? 'bg-amber-400' : 'bg-cyan-500'"
                      :style="{ width: `${task.progress}%` }"
                    />
                  </div>
                  <span class="text-[10px] font-bold text-gray-500">{{ task.progress }}%</span>
                </div>
              </div>

              <!-- Pause / Control action -->
              <div
                class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full shadow-md"
                :class="(task.state === 'paused') ? '!opacity-100' : ''"
              >
                <UButton
                  :icon="task.state === 'active' ? 'i-material-symbols-pause' : 'i-material-symbols-play-arrow'"
                  color="neutral"
                  :variant="task.state === 'paused' ? 'solid' : 'ghost'"
                  size="xs"
                  class="rounded-full"
                  :class="task.state === 'paused' ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'hover:bg-amber-500/10 hover:text-amber-500'"
                  @click.stop="toggleTaskPause(task.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}
</style>
