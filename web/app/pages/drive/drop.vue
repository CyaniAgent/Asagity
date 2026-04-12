<script setup lang="ts">
import { ref, computed } from 'vue'

const isDropping = ref(false)

// 1. Radar & Spatial Logic
// Separate different devices/users with distance
// Own devices: radius 200-280, Instance users: radius 400-500, Remote instances: radius 600+
interface PeerNode {
  id: string
  displayName: string
  username: string
  system: string
  avatar: string
  isSelf?: boolean
  isInstance?: boolean
  isRemote?: boolean
  radius: number
  angle: number // degrees
}

const discoveredNodes = ref<PeerNode[]>([
  // Own devices (closest orbit)
  { id: '1', displayName: 'Windows Desktop', username: 'syskuku', system: 'Windows', avatar: 'https://avatars.githubusercontent.com/u/739984?v=4', isSelf: true, radius: 220, angle: 0 },
  { id: '2', displayName: 'iPhone 15', username: 'syskuku', system: 'iOS', avatar: 'https://avatars.githubusercontent.com/u/10?v=4', isSelf: true, radius: 260, angle: 120 },
  { id: '3', displayName: 'MacBook Pro', username: 'syskuku', system: 'macOS', avatar: 'https://avatars.githubusercontent.com/u/11?v=4', isSelf: true, radius: 240, angle: 240 },
  // Instance users (middle orbit)
  { id: '4', displayName: 'Yuna Ayase', username: 'yuna_ayase', system: 'Web', avatar: 'https://avatars.githubusercontent.com/u/12?v=4', isInstance: true, radius: 420, angle: 45 },
  { id: '5', displayName: '静流', username: 'shizuru_official', system: 'Android', avatar: 'https://avatars.githubusercontent.com/u/13?v=4', isInstance: true, radius: 460, angle: 165 },
  { id: '6', displayName: 'Miku Producer', username: 'miku39', system: 'Web', avatar: 'https://avatars.githubusercontent.com/u/14?v=4', isInstance: true, radius: 440, angle: 285 },
  // Remote instances (outer orbit)
  { id: '7', displayName: 'misskey.io', username: 'remote', system: 'Instance', avatar: 'https://avatars.githubusercontent.com/u/15?v=4', isRemote: true, radius: 620, angle: 90 },
  { id: '8', displayName: 'mastodon.social', username: 'remote', system: 'Instance', avatar: 'https://avatars.githubusercontent.com/u/16?v=4', isRemote: true, radius: 650, angle: 270 }
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

    <!-- Page Top-Right: Transfer Task Manager -->
    <div class="absolute top-4 right-4 z-50 w-80 max-h-[300px] flex flex-col pointer-events-none">
      <div
        class="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[24px] border border-white/40 dark:border-gray-700/50 shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-auto transition-all duration-500"
        :class="queueExpanded ? 'max-h-[280px]' : 'max-h-[52px]'"
      >
        <!-- Header / Toggle -->
        <div
          class="h-13 px-4 cursor-pointer flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          @click="queueExpanded = !queueExpanded"
        >
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
              <UIcon
                name="i-material-symbols-sync-alt"
                class="w-4 h-4 text-cyan-600 dark:text-cyan-400"
                :class="activeTasks.some(t => t.state === 'active') ? 'animate-spin' : ''"
              />
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-black text-gray-900 dark:text-white">Active Transfers</span>
              <span class="text-[10px] font-bold text-cyan-500 tracking-wide">{{ activeTasks.filter(t => t.state === 'active').length }} Active</span>
            </div>
          </div>
          <UButton
            :icon="queueExpanded ? 'i-material-symbols-keyboard-arrow-up' : 'i-material-symbols-keyboard-arrow-down'"
            color="neutral"
            variant="ghost"
            size="xs"
            class="rounded-full pointer-events-none"
          />
        </div>

        <!-- Task List Body -->
        <div
          v-show="queueExpanded"
          class="px-3 pb-3 custom-scrollbar flex flex-col gap-2 max-h-[220px] overflow-y-auto"
        >
          <div
            v-for="task in activeTasks"
            :key="task.id"
            class="bg-white/80 dark:bg-gray-800/80 rounded-[16px] p-3 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-1 relative overflow-hidden group"
          >
            <div
              v-if="task.state === 'active' || task.state === 'paused'"
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-50/50 dark:from-cyan-900/10 to-transparent transition-all duration-300"
              :style="{ width: `${task.progress}%` }"
            />

            <div class="relative z-10 flex gap-3 items-center">
              <div class="relative shrink-0">
                <UAvatar
                  :src="task.targetAvatar"
                  size="sm"
                />
                <div
                  class="absolute -bottom-1 -right-1 rounded-full p-0.5"
                  :class="task.direction === 'send' ? 'bg-cyan-500 text-white' : 'bg-primary-500 text-white'"
                >
                  <UIcon
                    :name="task.direction === 'send' ? 'i-material-symbols-upload' : 'i-material-symbols-download'"
                    class="w-2.5 h-2.5"
                  />
                </div>
              </div>

              <div class="flex-1 min-w-0 pr-6">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span
                    class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate"
                    :title="task.fileName"
                  >{{ task.fileName }}</span>
                  <span
                    v-if="task.state === 'paused'"
                    class="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0"
                  >Paused</span>
                  <span
                    v-else
                    class="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 shrink-0"
                  >{{ task.speed }}</span>
                </div>

                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="task.state === 'paused' ? 'bg-amber-400' : 'bg-cyan-500'"
                      :style="{ width: `${task.progress}%` }"
                    />
                  </div>
                  <span class="text-[9px] font-bold text-gray-500 shrink-0">{{ task.progress }}%</span>
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

    <!-- Center Coordinate System: Radar Rings -->
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none z-0">
      <!-- Ring 1: My Devices (cyan) -->
      <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border-2 border-cyan-400/30 dark:border-cyan-500/20 shadow-[inset_0_0_60px_rgba(57,197,187,0.08)]"
        :class="{ 'border-cyan-400/60 scale-[1.01] shadow-[0_0_60px_rgba(57,197,187,0.25)]': isDropping }"
      />
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-cyan-600/50 dark:text-cyan-400/50 font-bold -mt-[260px] bg-white/60 dark:bg-gray-900/60 px-3 py-1 rounded-full backdrop-blur-sm border border-cyan-200/30 dark:border-cyan-800/30">
        My Devices
      </div>

      <!-- Ring 2: Instance Users (purple) -->
      <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-purple-300/30 dark:border-purple-500/20"
        :class="{ 'border-purple-400/50 scale-[1.005]': isDropping }"
      />
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-purple-500/60 dark:text-purple-400/60 font-bold -mt-[450px] bg-white/60 dark:bg-gray-900/60 px-3 py-1 rounded-full backdrop-blur-sm border border-purple-200/30 dark:border-purple-800/30">
        Instance Users
      </div>

      <!-- Ring 3: Remote Instances (gray) -->
      <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1300px] h-[1300px] rounded-full border border-gray-300/20 dark:border-gray-600/20"
        :class="{ 'border-gray-400/40 scale-[1.003]': isDropping }"
      />
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-gray-500/50 dark:text-gray-400/50 font-bold -mt-[650px] bg-white/60 dark:bg-gray-900/60 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30">
        Remote Instances
      </div>

      <!-- Pulsing Wave (Radar Sweep Animation) -->
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] rounded-full border-2 border-cyan-400/40 dark:border-cyan-500/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
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
            class="shadow-[0_4px_15px_rgba(0,0,0,0.15)] transition-all"
            :class="{
              'ring-2 ring-cyan-400/60': peer.isSelf,
              'ring-2 ring-purple-400/50': peer.isInstance,
              'ring-2 ring-gray-400/50': peer.isRemote
            }"
          />

          <div class="absolute -bottom-1 -right-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-0.5 shadow-sm">
            <UIcon
              :name="peer.isRemote ? 'i-material-symbols-cloud' : peer.system === 'iOS' || peer.system === 'macOS' ? 'i-simple-icons-apple' : peer.system === 'Android' ? 'i-simple-icons-android' : 'i-material-symbols-desktop-windows'"
              class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
            />
          </div>

          <!-- Type badge -->
          <div
            v-if="peer.isInstance || peer.isRemote"
            class="absolute -top-1 -left-1 z-20 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase"
            :class="peer.isInstance ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
          >
            {{ peer.isRemote ? 'Remote' : 'Instance' }}
          </div>

          <div
            class="mt-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-3 py-1.5 rounded-xl shadow-lg border border-white/50 dark:border-gray-700/50 flex flex-col items-center text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            :class="{ 'opacity-100': isDropping }"
          >
            <span class="text-xs font-black text-gray-900 dark:text-white">{{ peer.displayName }}</span>
            <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400">{{ peer.username }}</span>
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
