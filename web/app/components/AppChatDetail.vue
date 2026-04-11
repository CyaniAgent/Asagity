<script setup lang="ts">
import { useSplitViewStore } from '~/stores/splitView'

const splitViewStore = useSplitViewStore()

// Dummy message data for the UI
const messages = [
  { id: 1, text: 'Hey there! How is the new UI coming along?', isMe: false, time: '10:30', read: true },
  { id: 2, text: 'Producer-san! It\'s looking amazing! 39!', isMe: true, time: '10:32', read: true },
  { id: 3, text: 'We are working on the Chat module right now. The left-aligned design is super clean.', isMe: true, time: '10:33', read: false },
  { id: 4, text: 'That sounds perfect. Can\'t wait to see it running on Riverpod... well, Pinia here!', isMe: false, time: '10:35', read: false }
]

const newMessage = ref('')

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  // Add to mock messages
  messages.push({
    id: Date.now(),
    text: newMessage.value,
    isMe: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false
  })
  newMessage.value = ''
  // scroll to bottom logic could go here
}
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 border-none relative font-sans">
    <!-- Message List Area (Scrollable) -->
    <!-- The trick is padding-bottom to avoid the floating island blocking last messages -->
    <div class="flex-1 overflow-y-auto px-6 pt-6 pb-32 flex flex-col gap-5 custom-scrollbar">
      <!-- Contact Info Card (Instead of sticky header) -->
      <div class="mb-10 px-2 flex flex-col items-center text-center animate-[fade-in-up_0.6s_ease-out]">
        <div class="relative mb-4">
          <UAvatar
            :src="splitViewStore.currentChat?.avatar || 'https://avatars.githubusercontent.com/u/1024025?v=4'"
            :alt="splitViewStore.currentChat?.name || 'Chat Avatar'"
            size="xl"
            class="ring-[4px] ring-cyan-500/20 shadow-2xl"
          />
          <div
            v-if="splitViewStore.currentChat?.online"
            class="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-[3px] border-white dark:border-gray-900 shadow-sm"
          />
        </div>
        <h2 class="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
          {{ splitViewStore.currentChat?.name || 'Unknown' }}
          <UIcon
            name="i-material-symbols-verified-rounded"
            class="w-5 h-5 text-cyan-500"
          />
        </h2>
        <div class="flex flex-wrap justify-center gap-2 mt-2">
          <span
            v-if="splitViewStore.currentChat?.isGroup"
            class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] uppercase font-black tracking-widest"
          >
            {{ splitViewStore.currentChat?.members }} Members Group
          </span>
          <span class="text-[10px] uppercase font-black tracking-widest text-cyan-600 dark:text-cyan-400">
            End-to-End Encrypted
          </span>
        </div>
        <div class="h-px w-24 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mt-6 mb-2" />
      </div>

      <!-- ALL MESSAGES ALIGNED TO THE LEFT -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex items-start gap-4 max-w-[85%] group"
      >
        <!-- Avatar for everyone -->
        <UAvatar
          :src="msg.isMe ? 'https://avatars.githubusercontent.com/u/739984?v=4' : (splitViewStore.currentChat?.avatar || 'https://avatars.githubusercontent.com/u/1024025?v=4')"
          size="sm"
          class="shrink-0 mt-1"
          :class="msg.isMe ? 'ring-2 ring-cyan-500/50' : 'ring-1 ring-gray-200 dark:ring-gray-800'"
        />

        <div class="flex flex-col gap-1 min-w-0">
          <!-- Name & Time -->
          <div class="flex items-center gap-2 px-1">
            <span
              class="text-xs font-bold"
              :class="msg.isMe ? 'text-cyan-500' : 'text-gray-700 dark:text-gray-300'"
            >
              {{ msg.isMe ? 'Me' : (splitViewStore.currentChat?.name || 'User') }}
            </span>
            <span class="text-[10px] text-gray-400 font-medium">{{ msg.time }}</span>
          </div>

          <!-- Bubble -->
          <div
            class="px-4 py-3 rounded-[20px] rounded-tl-sm text-[15px] leading-relaxed shadow-sm transition-transform group-hover:-translate-y-0.5"
            :class="msg.isMe
              ? 'bg-cyan-500 text-white shadow-cyan-500/20'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-black/5'"
          >
            {{ msg.text }}
          </div>

          <!-- Read status (only for "Me" messages) -->
          <div
            v-if="msg.isMe"
            class="px-2 text-[10px] font-bold tracking-wider uppercase flex items-center justify-start h-3"
          >
            <span
              v-if="msg.read"
              class="text-cyan-500/70"
            >Read</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Input Island (Absolute at bottom) -->
    <div class="absolute bottom-6 left-0 right-0 px-6 pointer-events-none">
      <div class="pointer-events-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-black/10 rounded-[28px] p-2 flex flex-col gap-2 transition-all">
        <!-- Textarea / Input wrapper -->
        <div class="flex items-end gap-2 px-2 pb-1">
          <textarea
            v-model="newMessage"
            placeholder="Type a message..."
            class="w-full bg-transparent border-none focus:ring-0 resize-none text-[15px] max-h-32 min-h-[44px] py-3 text-gray-800 dark:text-gray-200 placeholder-gray-400 custom-scrollbar leading-tight font-medium"
            rows="1"
            @keydown.enter.prevent="sendMessage"
          />

          <!-- Send Button (Floating inside textarea area) -->
          <button
            class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 mb-0.5"
            :class="newMessage.trim() ? 'bg-cyan-500 text-white shadow-cyan-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'"
            @click="sendMessage"
          >
            <UIcon
              name="i-material-symbols-send-rounded"
              class="w-5 h-5"
            />
          </button>
        </div>

        <!-- Tool Island -->
        <div class="flex items-center gap-1.5 px-2 pb-1">
          <UButton
            icon="i-material-symbols-add-circle-outline"
            color="neutral"
            variant="ghost"
            class="text-gray-400 hover:text-cyan-500 rounded-full"
          />
          <UButton
            icon="i-material-symbols-image-outline"
            color="neutral"
            variant="ghost"
            class="text-gray-400 hover:text-cyan-500 rounded-full"
          />
          <div class="flex-1" />
          <UButton
            icon="i-material-symbols-call-outline"
            color="neutral"
            variant="ghost"
            class="text-gray-400 hover:text-cyan-500 rounded-full"
          />
          <UButton
            icon="i-material-symbols-videocam-outline"
            color="neutral"
            variant="ghost"
            class="text-gray-400 hover:text-cyan-500 rounded-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
}
</style>
