<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useSystemStore } from '~/stores/system'

const systemStore = useSystemStore()

const inputRef = ref<HTMLInputElement | null>(null)
const currentInput = ref('')
const terminalHistory = ref<{ type: 'input' | 'output' | 'system', text: string }[]>([
  { type: 'system', text: 'Asagity Recovery Terminal [Termity v1.0.0]' },
  { type: 'system', text: 'Type a command and press Enter.' }
])

const scrollToBottom = () => {
  nextTick(() => {
    const container = document.getElementById('termity-container')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

const handleCommand = () => {
  const cmd = currentInput.value.trim()
  if (!cmd) return

  terminalHistory.value.push({ type: 'input', text: cmd })

  if (cmd === 'func enable DevMode') {
    systemStore.enableDevMode(false)
    terminalHistory.value.push({ type: 'output', text: '> Developer Mode ENABLED (Session)' })
  } else if (cmd === 'func enable DevMode --forever') {
    systemStore.enableDevMode(true)
    terminalHistory.value.push({ type: 'output', text: '> Developer Mode ENABLED (Persistent)' })
  } else if (cmd === 'func disable DevMode') {
    systemStore.disableDevMode()
    terminalHistory.value.push({ type: 'output', text: '> Developer Mode DISABLED' })
  } else if (cmd === 'clear') {
    terminalHistory.value = []
  } else {
    terminalHistory.value.push({ type: 'output', text: `> Unknown command: ${cmd}` })
  }

  currentInput.value = ''
  scrollToBottom()
}

const focusInput = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

onMounted(() => {
  focusInput()
})
</script>

<template>
  <div
    class="w-full h-full bg-black text-green-500 font-mono text-sm p-4 flex flex-col overflow-hidden"
    @click="focusInput"
  >
    <div id="termity-container" class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pb-4">
      <div v-for="(line, idx) in terminalHistory" :key="idx" class="whitespace-pre-wrap">
        <span v-if="line.type === 'input'" class="text-cyan-400">> </span>
        <span :class="{
          'text-green-500': line.type === 'output',
          'text-yellow-500 font-bold': line.type === 'system',
          'text-white': line.type === 'input'
        }">{{ line.text }}</span>
      </div>
      
      <div class="flex items-center mt-2">
        <span class="text-cyan-400 shrink-0">> </span>
        <input
          ref="inputRef"
          v-model="currentInput"
          type="text"
          class="flex-1 bg-transparent border-none outline-none text-white ml-2 caret-green-500"
          spellcheck="false"
          autocomplete="off"
          @keydown.enter="handleCommand"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* A minimal customized scrollbar for the terminal */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.5);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(34, 197, 94, 0.5); /* green-500 */
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 197, 94, 0.8);
}
</style>
