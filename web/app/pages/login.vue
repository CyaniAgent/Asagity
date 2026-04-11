<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta } from '#imports'

definePageMeta({ layout: false })

const { post } = useApi()
const userStore = useUserStore()
const router = useRouter()
const toast = useAppToast()

const identifier = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!identifier.value || !password.value) return

  loading.value = true
  try {
    const data = await post('/api/auth/login', {
      identifier: identifier.value,
      password: password.value
    })

    userStore.setAuth(data)
    toast.add({
      title: '认证成功 (SYNC)',
      description: `欢迎回来, ${data.user.username}!`,
      color: 'success',
      icon: 'i-material-symbols-check-circle'
    })

    // Redirect to main panel
    router.push('/')
  } catch (err: any) {
    toast.add({
      title: '认证失败 (FAILED)',
      description: err.message || '凭证验证失败，请检查输入。',
      color: 'error',
      icon: 'i-material-symbols-error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-gray-900 text-white font-sans">
    <!-- Immersive Blurred Background -->
    <div class="absolute inset-0 z-0">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-900 to-cyan-950" />
      <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      <div class="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[80px]" />
      <!-- Scanline overlay effect -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmZmZmYwNSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none mix-blend-overlay" />
    </div>

    <!-- Back Button -->
    <div class="absolute top-8 left-8 z-20">
      <NuxtLink to="/welcome">
        <button class="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm font-bold">
          <UIcon
            name="i-material-symbols-arrow-back"
            class="w-4 h-4"
          />
          返回边界 (Return)
        </button>
      </NuxtLink>
    </div>

    <!-- Auth Card -->
    <div class="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-[fade-in-up_0.6s_ease-out]">
      <!-- Decor Ribbon -->
      <div class="absolute top-0 left-10 w-24 h-1 bg-cyan-500 shadow-[0_0_15px_#39C5BB] rounded-b-md" />

      <div class="flex flex-col items-center mb-8">
        <AppLogo class="w-14 h-14 drop-shadow-[0_0_20px_rgba(57,197,187,0.6)] mb-4" />
        <h1 class="text-3xl font-black tracking-wider text-white">
          身份认证层
        </h1>
        <span class="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase mt-1">Authenticate Matrix</span>
      </div>

      <form
        class="flex flex-col gap-6"
        @submit.prevent="handleLogin"
      >
        <!-- Input Group: Identifier -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">枢纽 ID / 邮箱</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UIcon
                name="i-material-symbols-person"
                class="w-5 h-5 text-gray-500"
              />
            </div>
            <input
              v-model="identifier"
              type="text"
              required
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
              placeholder="syskuku@asagity.net"
            >
          </div>
        </div>

        <!-- Input Group: Password -->
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center ml-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">访问密钥</label>
            <a
              href="#"
              class="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 hover:underline"
            >忘记密钥？</a>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UIcon
                name="i-material-symbols-lock"
                class="w-5 h-5 text-gray-500"
              />
            </div>
            <input
              v-model="password"
              type="password"
              required
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
              placeholder="••••••••••••"
            >
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="w-full mt-2 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-gray-900 font-black tracking-widest py-3.5 rounded-2xl shadow-[0_0_20px_rgba(57,197,187,0.3)] hover:shadow-[0_0_30px_rgba(57,197,187,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          :disabled="loading"
        >
          <UIcon
            v-if="loading"
            name="i-material-symbols-progress-activity"
            class="w-5 h-5 animate-spin"
          />
          {{ loading ? 'VERIFYING...' : '登录至实例 (SYNC)' }}
        </button>
      </form>

      <!-- Sub text -->
      <div class="mt-8 text-center text-xs text-gray-400 font-medium border-t border-white/10 pt-6">
        尚未分配系统凭证？
        <NuxtLink
          to="/register"
          class="text-cyan-400 font-bold hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30"
        >
          初始化新账号 \>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
