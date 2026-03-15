<script setup lang="ts">
import * as mfm from 'mfm-js'
import { computed } from 'vue'

defineOptions({
  name: 'MfmRenderer'
})

const props = defineProps<{
  text?: string
  nodes?: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  plain?: boolean
}>()

const displayNodes = computed<any[]>(() => { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (props.nodes) return props.nodes
  if (props.text) {
    try {
      return mfm.parse(props.text)
    } catch (e) {
      console.error('MFM parse error:', e)
      return [{ type: 'text', props: { text: props.text } }]
    }
  }
  return []
})
</script>

<template>
  <span class="mfm-container">
    <template
      v-for="(node, i) in displayNodes"
      :key="i"
    >
      <!-- Plain Text -->
      <template v-if="node.type === 'text'">{{ node.props.text }}</template>

      <!-- Bold -->
      <strong
        v-else-if="node.type === 'bold'"
        class="font-bold"
      >
        <MfmRenderer :nodes="node.children" />
      </strong>

      <!-- Italic -->
      <em
        v-else-if="node.type === 'italic'"
        class="italic text-[1em]"
      >
        <MfmRenderer :nodes="node.children" />
      </em>

      <!-- Strike -->
      <del
        v-else-if="node.type === 'strike'"
        class="line-through opacity-70"
      >
        <MfmRenderer :nodes="node.children" />
      </del>

      <!-- Inline Code -->
      <code
        v-else-if="node.type === 'inlineCode'"
        class="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-sm"
      >
        {{ node.props.code }}
      </code>

      <!-- Mention -->
      <span
        v-else-if="node.type === 'mention'"
        class="text-cyan-500 cursor-pointer hover:underline"
      >
        @{{ node.props.username }}{{ node.props.host ? `@${node.props.host}` : '' }}
      </span>

      <!-- Hashtag -->
      <span
        v-else-if="node.type === 'hashtag'"
        class="text-cyan-500 cursor-pointer hover:underline"
      >
        #{{ node.props.hashtag }}
      </span>

      <!-- URL -->
      <a
        v-else-if="node.type === 'url'"
        :href="node.props.url"
        target="_blank"
        class="text-blue-500 hover:underline"
      >
        {{ node.props.url }}
      </a>

      <!-- Fn (Function) - $[spin], $[rainbow], etc. -->
      <span
        v-else-if="node.type === 'fn'"
        :class="[`mfm-fn-${node.props.name}`]"
        :style="node.props.args"
      >
        <MfmRenderer :nodes="node.children" />
      </span>

      <!-- Tada -->
      <span
        v-else-if="node.type === 'tada'"
        class="mfm-tada inline-block"
      >
        <MfmRenderer :nodes="node.children" />
      </span>

      <!-- Unicode Emoji -->
      <template v-else-if="node.type === 'unicodeEmoji'">{{ node.props.emoji }}</template>

      <!-- Emoji Code -->
      <template v-else-if="node.type === 'emojiCode'">:{{ node.props.name }}:</template>

      <!-- Unknown / Fallback -->
      <template v-else>
        <span class="opacity-50 text-xs">[{{ node.type }}]</span>
      </template>
    </template>
  </span>
</template>

<style>
.mfm-fn-spin {
  display: inline-block;
  animation: mfm-spin 2s linear infinite;
}
@keyframes mfm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mfm-fn-rainbow {
  animation: mfm-rainbow 2s linear infinite;
}
@keyframes mfm-rainbow {
  0% { color: #ff0000; }
  20% { color: #ffff00; }
  40% { color: #00ff00; }
  60% { color: #00ffff; }
  80% { color: #0000ff; }
  100% { color: #ff00ff; }
}

.mfm-fn-shake {
  display: inline-block;
  animation: mfm-shake 0.2s linear infinite;
}
@keyframes mfm-shake {
  0% { transform: translate(0, 0); }
  25% { transform: translate(2px, 2px); }
  50% { transform: translate(0, 0); }
  75% { transform: translate(-2px, -2px); }
  100% { transform: translate(0, 0); }
}

.mfm-fn-jump {
  display: inline-block;
  animation: mfm-jump 0.5s linear infinite;
}
@keyframes mfm-jump {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.mfm-tada {
  animation: mfm-tada 1s infinite;
}
@keyframes mfm-tada {
  0% { transform: scale(1); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
  40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0); }
}
</style>
