<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useSystemStore } from '~/stores/system'

const userStore = useUserStore()
const systemStore = useSystemStore()
const isDropping = ref(false)

// 1. Identity Logic (Native Info)
const myDevice = computed(() => {
  const info = systemStore.hostInfo
  const platformStr = info?.platform?.toLowerCase() || ''

  let icon = 'i-material-symbols-desktop-windows-rounded'
  if (platformStr.includes('linux') || platformStr.includes('ubuntu') || platformStr.includes('debian')) {
    icon = 'i-simple-icons-linux'
  } else if (platformStr.includes('mac') || platformStr.includes('darwin')) {
    icon = 'i-simple-icons-apple'
  } else if (platformStr.includes('win')) {
    icon = 'i-material-symbols-desktop-windows-rounded'
  }

  return {
    deviceName: info?.hostname || 'Scanning Device...',
    pubId: 'pub-8f2e-9d1a-4c5b-39c5', // Static for now
    platform: info?.platform || 'Detecting OS...',
    icon
  }
})

// 2. Peer Discovery Logic
interface PeerNode {
  id: string
  displayName: string
  username: string
  system: string
  avatar: string
  isSelf?: boolean
  isInstance?: boolean
  isRemote?: boolean
}

const rawDiscoveredNodes = ref<PeerNode[]>([
  { id: '1', displayName: 'iPhone 15', username: 'syskuku', system: 'iOS', avatar: 'https://avatars.githubusercontent.com/u/10?v=4', isSelf: true },
  { id: '2', displayName: 'MacBook Pro', username: 'syskuku', system: 'macOS', avatar: 'https://avatars.githubusercontent.com/u/11?v=4', isSelf: true },
  { id: '4', displayName: 'Yuna Ayase', username: 'yuna_ayase', system: 'Web', avatar: 'https://avatars.githubusercontent.com/u/12?v=4', isInstance: true },
  { id: '5', displayName: '静流', username: 'shizuru_official', system: 'Android', avatar: 'https://avatars.githubusercontent.com/u/13?v=4', isInstance: true },
  { id: '6', displayName: 'Miku Producer', username: 'miku39', system: 'Web', avatar: 'https://avatars.githubusercontent.com/u/14?v=4', isInstance: true },
  { id: '7', displayName: 'misskey.io', username: 'remote', system: 'Instance', avatar: 'https://avatars.githubusercontent.com/u/15?v=4', isRemote: true }
])

// Filter out nodes that represent nearby devices (not me)
const nearbyNodes = computed(() => rawDiscoveredNodes.value)

// Jittered Grid Positioning for Peers (ensures spacing and no overlap)
const getPeerPosition = (id: string, index: number) => {
  // Virtual Grid: 3 columns x 3 rows (supports up to 9 visible devices in the safe zone)
  const cols = 3
  const rows = 3
  const cellWidth = 100 / cols
  const cellHeight = 100 / rows

  const col = index % cols
  const row = Math.floor(index / cols) % rows

  // Deterministic jitter based on node ID to make it look "random" but keep it stable
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const jitterFactor = 0.6 // Use 60% of cell space for jittering

  const jitterX = (Math.sin(seed * 1.5) * 0.5 + 0.5) * (cellWidth * jitterFactor)
  const jitterY = (Math.cos(seed * 1.5) * 0.5 + 0.5) * (cellHeight * jitterFactor)

  // Center in cell then apply jitter
  const left = col * cellWidth + jitterX + (cellWidth * (1 - jitterFactor) / 2)
  const bottom = row * cellHeight + jitterY + (cellHeight * (1 - jitterFactor) / 2)

  return {
    left: `${left}%`,
    bottom: `${bottom}%`,
    zIndex: 10 + index
  }
}

// 3. Transferred Tasks Management
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
    fileName: 'Project_Final_v2.psd',
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
    fileName: 'Vocaloid_Miku.zip',
    fileSize: '1.2 GB',
    progress: 32,
    speed: '0 KB/s',
    direction: 'receive',
    state: 'paused',
    targetUserName: 'shizuru_official',
    targetAvatar: 'https://avatars.githubusercontent.com/u/11?v=4'
  },
  {
    id: 't-3',
    fileName: 'wallpaper_4k.png',
    fileSize: '12 MB',
    progress: 100,
    speed: 'Done',
    direction: 'send',
    state: 'completed',
    targetUserName: 'yuna_ayase',
    targetAvatar: 'https://avatars.githubusercontent.com/u/12?v=4'
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

// Drag Handlers
const onDragOver = () => { isDropping.value = true }
const onDragLeave = () => { isDropping.value = false }
const onDrop = () => { isDropping.value = false }
</script>

<template>
  <div
    class="fixed inset-0 top-[64px] z-0 overflow-hidden bg-gray-50/30 dark:bg-gray-950/20 backdrop-blur-[2px] transition-colors duration-500"
    :class="{ '!bg-gray-900/60 dark:!bg-black/60': isDropping }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Background Decor -->
    <div class="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-400 rounded-full blur-[120px]" />
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500 rounded-full blur-[120px]" />
    </div>

    <!-- 1. Top-Left: Identity Block (This Device) -->
    <div class="absolute top-8 left-8 z-20 flex flex-col gap-4 animate-[fade-in_0.5s_ease-out]">
      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 p-5 rounded-[28px] shadow-xl flex items-center gap-4 group">
        <div class="relative">
          <UAvatar
            :src="userStore.avatar"
            size="xl"
            class="ring-4 ring-cyan-500/20 group-hover:ring-cyan-500/40 transition-all shadow-md"
          />
          <div class="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md border border-gray-100 dark:border-gray-700">
            <UIcon
              :name="myDevice.icon"
              class="w-4 h-4 text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="text-lg font-black text-gray-900 dark:text-white">{{ userStore.username }}</span>
            <span class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 tracking-tighter">Owner</span>
          </div>
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400 opacity-80 mt-1">{{ myDevice.deviceName }}</span>
          <div class="mt-2 flex items-center gap-1.5 py-1 px-2.5 bg-black/5 dark:bg-white/5 rounded-full w-fit max-w-[200px]">
            <UIcon
              name="i-material-symbols-fingerprint-rounded"
              class="w-3.5 h-3.5 text-cyan-500 shrink-0"
            />
            <span
              class="text-[9px] font-mono font-bold text-gray-400 dark:text-gray-500 truncate"
              :title="myDevice.pubId"
            >{{ myDevice.pubId }}</span>
          </div>
          <div class="mt-1 flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md w-fit">
            <span class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{{ myDevice.platform }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Bottom-Left: Nearby Devices (Jittered Grid Layout) -->
    <div class="absolute left-8 bottom-8 top-44 right-[440px] z-10 pointer-events-none overflow-hidden">
      <!-- Transition Group for smooth peer appearance -->
      <transition-group name="peer">
        <div
          v-for="(peer, index) in nearbyNodes"
          :key="peer.id"
          class="absolute pointer-events-auto transition-all duration-700 group cursor-pointer"
          :style="getPeerPosition(peer.id, index)"
        >
          <div class="flex flex-col items-center gap-3 hover:scale-110 active:scale-95 transition-all duration-300">
            <!-- Peer Avatar (Top) -->
            <div class="relative">
              <div class="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <UAvatar
                :src="peer.avatar"
                size="3xl"
                class="shadow-xl ring-2 transition-all duration-300 relative z-10"
                :class="[
                  peer.isSelf ? 'ring-cyan-500/40 group-hover:ring-cyan-500' : 'ring-gray-200 dark:ring-gray-700 group-hover:ring-primary-500/50'
                ]"
              />
              <div class="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg border border-gray-100 dark:border-gray-700 z-20">
                <UIcon
                  :name="peer.system === 'iOS' ? 'i-simple-icons-apple' : peer.system === 'Android' ? 'i-simple-icons-android' : peer.system === 'Web' ? 'i-material-symbols-language-rounded' : 'i-material-symbols-desktop-windows-rounded'"
                  class="w-4 h-4 text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>

            <!-- Display Name & Type (Bottom) -->
            <div class="flex flex-col items-center text-center -mt-1 py-1.5 px-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/30 shadow-sm opacity-0 group-hover:opacity-100 transition-all group-hover:translate-y-1">
              <span class="text-[13px] font-black text-gray-900 dark:text-white whitespace-nowrap">{{ peer.displayName }}</span>
              <div class="flex items-center gap-1">
                <span class="text-[9px] font-bold text-gray-500 dark:text-gray-400">{{ peer.system }}</span>
                <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span
                  v-if="peer.isRemote"
                  class="text-[9px] font-black text-amber-500 uppercase"
                >Remote</span>
                <span
                  v-else
                  class="text-[9px] font-black text-cyan-500 uppercase"
                >Local</span>
              </div>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 3. Right: Activity Panel -->
    <div class="absolute top-0 right-0 bottom-0 w-[400px] z-30 flex flex-col p-6 animate-[slide-left_0.6s_ease-out]">
      <div class="flex-1 bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl border-l border-white/20 dark:border-gray-800/50 shadow-2xl rounded-[40px] flex flex-col overflow-hidden">
        <!-- Panel Header -->
        <div class="px-8 pt-8 pb-4 shrink-0 flex items-center justify-between">
          <div class="flex flex-col">
            <h3 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Active Transfer
            </h3>
            <span class="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1">Activity Log</span>
          </div>
          <UButton
            icon="i-material-symbols-settings-rounded"
            color="neutral"
            variant="ghost"
            class="rounded-full"
          />
        </div>

        <!-- Task List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 flex flex-col gap-4">
          <div
            v-for="task in activeTasks"
            :key="task.id"
            class="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-[24px] border border-white/40 dark:border-gray-700/30 p-4 shadow-sm group hover:shadow-lg transition-all duration-300"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="relative">
                <UAvatar
                  :src="task.targetAvatar"
                  size="sm"
                />
                <div
                  class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                  :class="task.direction === 'send' ? 'bg-cyan-500 text-white' : 'bg-primary-500 text-white'"
                >
                  <UIcon
                    :name="task.direction === 'send' ? 'i-material-symbols-upload-rounded' : 'i-material-symbols-download-rounded'"
                    class="w-3 h-3"
                  />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-black text-gray-900 dark:text-white truncate">
                  {{ task.fileName }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-bold text-gray-400 uppercase">{{ task.fileSize }}</span>
                  <span class="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <span
                    class="text-[10px] font-bold"
                    :class="task.state === 'active' ? 'text-cyan-500' : 'text-gray-400'"
                  >{{ task.speed }}</span>
                </div>
              </div>
              <UButton
                v-if="task.state === 'active' || task.state === 'paused'"
                :icon="task.state === 'active' ? 'i-material-symbols-pause-rounded' : 'i-material-symbols-play-arrow-rounded'"
                color="neutral"
                variant="soft"
                size="xs"
                class="rounded-full shrink-0"
                @click="toggleTaskPause(task.id)"
              />
            </div>

            <!-- Progress Bar -->
            <div class="relative h-2.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(57,197,187,0.4)]"
                :class="[
                  task.state === 'completed' ? 'bg-primary-500'
                  : task.state === 'paused' ? 'bg-amber-400' : 'bg-cyan-500'
                ]"
                :style="{ width: `${task.progress}%` }"
              />
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{{ task.state }}</span>
              <span class="text-[10px] font-black text-cyan-500">{{ task.progress }}%</span>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="activeTasks.length === 0"
            class="flex flex-col items-center justify-center py-10 opacity-30"
          >
            <UIcon
              name="i-material-symbols-history-rounded"
              class="w-10 h-10 mb-2"
            />
            <span class="text-xs font-bold uppercase tracking-widest">No Recent Activity</span>
          </div>
        </div>

        <!-- Panel Footer -->
        <div class="p-8 border-t border-white/10 dark:border-gray-800/30 bg-black/5 dark:bg-white/5 flex flex-col gap-3 shrink-0">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase">Storage Used</span>
            <span class="text-[11px] font-black text-gray-900 dark:text-white tracking-widest">12.4 GB / 100 GB</span>
          </div>
          <div class="h-1.5 w-full bg-gray-300/30 dark:bg-gray-700/30 rounded-full overflow-hidden">
            <div class="h-full bg-cyan-400/50 w-[12.4%] rounded-full shadow-[0_0_8px_rgba(57,197,187,0.3)]" />
          </div>
        </div>
      </div>
    </div>

    <!-- Global Drop Indication Overlay -->
    <div
      v-show="isDropping"
      class="absolute inset-0 z-40 pointer-events-none flex items-center justify-center bg-cyan-500/10 backdrop-blur-md"
    >
      <div class="flex flex-col items-center gap-6 animate-[bounce_1s_infinite]">
        <div class="w-32 h-32 rounded-[40px] border-4 border-dashed border-cyan-500 flex items-center justify-center bg-cyan-500/20">
          <UIcon
            name="i-material-symbols-cloud-upload-rounded"
            class="w-16 h-16 text-cyan-500"
          />
        </div>
        <h2 class="text-4xl font-black text-cyan-500 drop-shadow-[0_0_20px_rgba(57,197,187,0.8)] tracking-[0.2em]">
          DROP TO AIRDROP
        </h2>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-left {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Peer Transition Group */
.peer-enter-active,
.peer-leave-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.peer-enter-from,
.peer-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* Glassmorphism Refinement */
.backdrop-blur-3xl {
  backdrop-filter: blur(60px);
}
</style>
