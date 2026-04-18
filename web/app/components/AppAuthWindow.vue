<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  mode?: 'login' | 'register'
  onClose?: () => void
}>()

const emit = defineEmits(['switch-mode'])

const { post } = useApi()
const userStore = useUserStore()
const router = useRouter()
const toast = useAppToast()

const isLogin = computed(() => props.mode === 'login')
const identifier = ref('')
const password = ref('')
const email = ref('')
const username = ref('')
const loading = ref(false)

async function handleLogin() {
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

function switchToRegister() {
  emit('switch-mode', 'register')
}

function switchToLogin() {
  emit('switch-mode', 'login')
}
</script>

<template>
  <div class="h-full flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 right-0 w-[200px] h-[200px] bg-cyan-500/10 rounded-full blur-[60px]" />
      <div class="absolute bottom-0 left-0 w-[150px] h-[150px] bg-fuchsia-500/10 rounded-full blur-[50px]" />
    </div>

    <div class="relative z-10 flex-1 flex flex-col justify-center px-6 py-8 overflow-y-auto custom-scrollbar">
      <div class="w-full max-w-[340px] mx-auto space-y-6">
        <div class="flex flex-col items-center mb-6">
          <AppLogo class="w-12 h-12 drop-shadow-[0_0_15px_rgba(57,197,187,0.6)] mb-3" />
          <h1 class="text-2xl font-black tracking-wider text-white">
            {{ isLogin ? '身份认证层' : '初始化身份' }}
          </h1>
          <span class="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase">{{ isLogin ? 'Authenticate Matrix' : 'Initialize Identity' }}</span>
        </div>

        <form
          v-if="isLogin"
          class="flex flex-col gap-5"
          @submit.prevent="handleLogin"
        >
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">枢纽 ID / 邮箱</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UIcon
                  name="i-material-symbols-person"
                  class="w-4 h-4 text-gray-500"
                />
              </div>
              <input
                v-model="identifier"
                type="text"
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="syskuku@asagity.net"
              >
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center ml-1">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">访问密钥</label>
              <a
                href="#"
                class="text-[9px] font-bold text-cyan-500 hover:text-cyan-400"
              >忘记密钥？</a>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UIcon
                  name="i-material-symbols-lock"
                  class="w-4 h-4 text-gray-500"
                />
              </div>
              <input
                v-model="password"
                type="password"
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="••••••••"
              >
            </div>
          </div>

          <button
            type="submit"
            class="w-full mt-1 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-gray-900 font-black tracking-wider py-3 rounded-xl shadow-[0_0_15px_rgba(57,197,187,0.3)] hover:shadow-[0_0_25px_rgba(57,197,187,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm"
            :disabled="loading"
          >
            <UIcon
              v-if="loading"
              name="i-material-symbols-progress-activity"
              class="w-4 h-4 animate-spin"
            />
            {{ loading ? 'VERIFYING...' : '登录至实例' }}
          </button>
        </form>

        <div v-else>
          <div class="text-center text-gray-400 text-xs mb-4">
            注册功能即将开放，敬请期待...
          </div>
          <button
            type="button"
            class="w-full bg-white/10 hover:bg-white/20 text-white font-bold tracking-wider py-3 rounded-xl border border-white/10 transition-all text-sm"
            @click="switchToLogin"
          >
            返回登录
          </button>
        </div>

        <div class="flex items-center gap-3 my-2 opacity-40">
          <div class="h-px bg-white/20 flex-1" />
          <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">or</span>
          <div class="h-px bg-white/20 flex-1" />
        </div>

        <div class="text-center text-[10px] text-gray-400 font-medium">
          {{ isLogin ? '尚未分配系统凭证？' : '已有凭证？' }}
          <button
            type="button"
            class="text-cyan-400 font-bold hover:text-cyan-300 ml-1"
            @click="isLogin ? switchToRegister() : switchToLogin()"
          >
            {{ isLogin ? '初始化新账号' : '返回登录' }}
          </button>
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
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(57, 197, 187, 0.5);
  border-radius: 4px;
}
</style>
