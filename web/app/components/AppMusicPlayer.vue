<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '~/stores/music'
import MusicLyricsWindow from '~/components/MusicLyricsWindow.vue'

const musicStore = useMusicStore()

// Compact active/text colors from store
const activeColor = computed(() => musicStore.themeColor)
const textColor = computed(() => musicStore.textColor)

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === null) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleProgressChange(e: Event) {
  const target = e.target as HTMLInputElement
  musicStore.setProgress(parseFloat(target.value))
}

// Stop function: Reset progress and pause if playing
function handleStop() {
  musicStore.seek(0)
  if (musicStore.isPlaying) {
    musicStore.togglePlay()
  }
}

function selectTrack(index: number) {
  musicStore.setTrackByIndex(index)
}
</script>

<template>
  <div
    class="relative w-[320px] max-w-full rounded-[28px] overflow-hidden font-sans select-none border border-white/10 dark:border-gray-800/80 shadow-2xl flex flex-col transition-all duration-500 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl"
    :style="{ '--theme-color': activeColor, '--text-color': textColor }"
  >
    <!-- Dynamic Album Art Blurred Background -->
    <div
      class="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000"
      :style="{ backgroundColor: musicStore.themeColor }"
    >
      <img
        :src="musicStore.currentTrack.albumArt"
        class="w-full h-full object-cover scale-150 blur-[80px] opacity-25 dark:opacity-35 transition-all duration-1000"
        alt=""
      >
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 dark:via-black/5 dark:to-black/10" />
    </div>

    <!-- Core Content -->
    <div class="relative z-10 p-5 flex flex-col">
      <!-- Loading Overlay -->
      <div
        v-if="musicStore.isLoading"
        class="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-40 flex items-center justify-center rounded-[28px]"
      >
        <div class="flex flex-col items-center gap-3">
          <UIcon
            name="i-material-symbols-progress-activity"
            class="w-8 h-8 text-cyan-500 animate-spin"
          />
          <p class="text-[10px] font-normal tracking-widest text-gray-900/50 dark:text-white/70 uppercase">
            Loading...
          </p>
        </div>
      </div>

      <!-- Top Section: Album Cover & Track Info -->
      <div class="flex items-center gap-3.5 mb-4">
        <!-- Rotating Cover -->
        <div class="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-black/5 dark:border-white/10">
          <img
            :src="musicStore.currentTrack.albumArt"
            class="w-full h-full object-cover origin-center"
            alt="Cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        <!-- Metadata -->
        <div class="flex-1 min-w-0">
          <h1 class="text-base font-normal truncate leading-tight player-title">
            {{ musicStore.currentTrack.title }}
          </h1>
          <p class="text-xs font-normal truncate mt-1 player-artist">
            {{ musicStore.currentTrack.artist || 'Unknown Artist' }}
          </p>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="w-full mb-4 space-y-1.5">
        <!-- Custom Seek Bar -->
        <div class="relative w-full h-1 bg-gray-900/5 dark:bg-white/10 rounded-full group cursor-pointer">
          <input
            type="range"
            :min="0"
            :max="musicStore.currentTrack.duration || 100"
            :value="musicStore.progress"
            step="0.1"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            @input="handleProgressChange"
          >
          <div
            class="absolute top-0 left-0 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(57,197,187,0.6)]"
            :style="{ width: `${musicStore.progressPercentage}%`, backgroundColor: activeColor }"
          />
          <div
            class="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            :style="{ left: `${musicStore.progressPercentage}%` }"
          />
        </div>
        <!-- Time Indicators -->
        <div class="flex justify-between text-[10px] font-normal player-time">
          <span>{{ formatTime(musicStore.progress) }}</span>
          <span>{{ formatTime(musicStore.currentTrack.duration) }}</span>
        </div>
      </div>

      <!-- Controls Row: osu!-Inspired -->
      <div class="w-full flex items-center justify-between gap-1 mb-1">
        <!-- Shuffle -->
        <button
          class="ctrl-btn-small"
          :class="musicStore.shuffle ? 'active' : ''"
          title="随机播放"
          @click="musicStore.toggleShuffle"
        >
          <UIcon
            name="i-material-symbols-shuffle"
            class="w-4 h-4"
          />
        </button>

        <!-- Previous -->
        <button
          class="ctrl-btn"
          title="上一首"
          @click="musicStore.playPrev"
        >
          <UIcon
            name="i-material-symbols-skip-previous"
            class="w-5 h-5"
          />
        </button>

        <!-- Play/Pause -->
        <button
          class="play-btn shadow-lg"
          :style="{ backgroundColor: activeColor, color: textColor }"
          title="播放/暂停"
          @click="musicStore.togglePlay"
        >
          <UIcon
            :name="musicStore.isPlaying ? 'i-material-symbols-pause' : 'i-material-symbols-play-arrow'"
            class="w-6 h-6"
            :class="!musicStore.isPlaying && 'translate-x-[1px]'"
          />
        </button>

        <!-- Stop -->
        <button
          class="ctrl-btn"
          title="停止"
          @click="handleStop"
        >
          <UIcon
            name="i-material-symbols-stop-rounded"
            class="w-5 h-5"
          />
        </button>

        <!-- Next -->
        <button
          class="ctrl-btn"
          title="下一首"
          @click="musicStore.playNext(false)"
        >
          <UIcon
            name="i-material-symbols-skip-next"
            class="w-5 h-5"
          />
        </button>

        <!-- Loop Mode -->
        <button
          class="ctrl-btn-small"
          :class="musicStore.loopMode !== 'none' ? 'active' : ''"
          :title="musicStore.loopMode === 'one' ? '单曲循环' : (musicStore.loopMode === 'all' ? '列表循环' : '无循环')"
          @click="musicStore.toggleLoopMode"
        >
          <UIcon
            :name="musicStore.loopMode === 'one' ? 'i-material-symbols-repeat-one' : 'i-material-symbols-repeat'"
            class="w-4 h-4"
          />
        </button>

        <!-- Open Float Lyrics -->
        <button
          class="ctrl-btn-small"
          :class="musicStore.isLyricsWindowOpen ? 'active' : ''"
          title="桌面歌词"
          @click="musicStore.isLyricsWindowOpen = !musicStore.isLyricsWindowOpen"
        >
          <UIcon
            name="i-material-symbols-lyrics"
            class="w-4 h-4"
          />
        </button>

        <!-- Toggle Playlist -->
        <button
          class="ctrl-btn-small"
          :class="musicStore.isPlaylistWindowOpen ? 'active' : ''"
          title="播放队列"
          @click="musicStore.isPlaylistWindowOpen = !musicStore.isPlaylistWindowOpen"
        >
          <UIcon
            name="i-material-symbols-queue-music"
            class="w-4 h-4"
          />
        </button>
      </div>

      <!-- Collapsible Local Playlist Queue -->
      <Transition name="drawer">
        <div
          v-if="musicStore.isPlaylistWindowOpen"
          class="mt-4 pt-4 border-t border-gray-900/5 dark:border-white/5 flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar select-none"
        >
          <div
            v-for="(track, index) in musicStore.playlist"
            :key="track.id"
            class="playlist-item flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-200"
            :class="musicStore.currentIndex === index ? 'active' : ''"
            @click="selectTrack(index)"
          >
            <div class="flex items-center gap-3 overflow-hidden w-full">
              <!-- Playing State Icon -->
              <div class="w-5 h-5 flex items-center justify-center shrink-0 playlist-item-num">
                <UIcon
                  v-if="musicStore.currentIndex === index && musicStore.isPlaying"
                  name="i-material-symbols-volume-up"
                  class="w-4 h-4 text-cyan-500 animate-pulse playlist-volume-icon"
                />
                <span
                  v-else
                  class="text-[10px] font-normal opacity-40 playlist-index-num"
                >
                  {{ index + 1 }}
                </span>
              </div>
              <!-- Track Metadata -->
              <div class="flex flex-col min-w-0">
                <span
                  class="text-xs font-normal truncate playlist-item-title"
                >
                  {{ track.title }}
                </span>
                <span class="text-[9px] font-normal opacity-45 truncate mt-0.5 playlist-item-artist">
                  {{ track.artist || 'Local Track' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Teleported Floating Components -->
    <MusicLyricsWindow />
  </div>
</template>

<style scoped>
/* Text Adaptive Colors & HarmonyOS Sans */
.player-title {
  color: var(--text-color);
  font-family: inherit;
}

.player-artist {
  color: color-mix(in srgb, var(--text-color) 60%, transparent);
  font-family: inherit;
}

.player-time {
  color: color-mix(in srgb, var(--text-color) 45%, transparent);
  font-family: inherit;
}

/* Control Buttons Styling - Adaptive Color */
.ctrl-btn,
.ctrl-btn-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: color-mix(in srgb, var(--text-color) 60%, transparent);
}

.ctrl-btn {
  width: 2.25rem;
  height: 2.25rem;
}
.ctrl-btn-small {
  width: 1.75rem;
  height: 1.75rem;
}

.ctrl-btn:hover,
.ctrl-btn-small:hover {
  background-color: color-mix(in srgb, var(--text-color) 8%, transparent);
  color: var(--text-color);
}

.ctrl-btn:active,
.ctrl-btn-small:active {
  transform: scale(0.9);
}

/* Active Highlight: ONLY background container highlights with theme color, icon itself matches contrast black/white */
.ctrl-btn-small.active {
  background-color: color-mix(in srgb, var(--theme-color) 22%, transparent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--theme-color) 20%, transparent);
  color: var(--text-color) !important;
}

/* Play/Pause Button */
.play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--theme-color) 35%, transparent);
}

.play-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--theme-color) 45%, transparent);
}

.play-btn:active {
  transform: scale(0.92);
}

/* Local Playlist Styles */
.playlist-item {
  color: var(--text-color);
  font-family: inherit;
}
.playlist-item-title {
  color: var(--text-color);
  font-family: inherit;
}
.playlist-item-artist {
  color: color-mix(in srgb, var(--text-color) 45%, transparent);
  font-family: inherit;
}
.playlist-index-num {
  color: var(--text-color);
  opacity: 0.4;
  font-family: inherit;
}
.playlist-volume-icon {
  color: var(--theme-color);
}

.playlist-item.active {
  background-color: color-mix(in srgb, var(--theme-color) 15%, transparent);
}
.playlist-item.active .playlist-item-title {
  color: var(--theme-color);
  font-weight: 400; /* keep regular */
}
.playlist-item.active .playlist-index-num {
  color: var(--theme-color);
  opacity: 1;
}

.playlist-item:hover:not(.active) {
  background-color: color-mix(in srgb, var(--text-color) 6%, transparent);
}

/* Playlist Drawer Animation */
.drawer-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.drawer-leave-active {
  transition: all 0.2s cubic-bezier(0.36, 0, 0.66, -0.56);
}
.drawer-enter-from, .drawer-leave-to {
  opacity: 0;
  max-height: 0px;
  transform: translateY(-8px);
}

/* Custom Mini Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 99px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
</style>
