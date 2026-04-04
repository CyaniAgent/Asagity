<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta } from '#imports'

definePageMeta({ layout: false })

const { post } = useApi()
const userStore = useUserStore()
const router = useRouter()
const toast = useAppToast()

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) return
  
  loading.value = true
  try {
    const data = await post('/api/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value
    })
    
    userStore.setAuth(data)
    toast.add({
      title: '初始化成功 (INITIALIZED)',
      description: '欢迎来到 Asagity 枢纽, 你的节点已激活!',
      color: 'success',
      icon: 'i-material-symbols-check-circle'
    })
    
    // Redirect to main panel
    router.push('/')
  } catch (err: any) {
    toast.add({
      title: '初始化失败 (FAILED)',
      description: err.message || '注册请求被拒绝，请检查输入。',
      color: 'error',
      icon: 'i-material-symbols-error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative w-screen min-h-screen overflow-x-hidden flex items-center justify-center bg-gray-900 text-white font-sans py-12">
    
    <!-- Immersive Blurred Background -->
    <div class="absolute inset-0 z-0 fixed">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-900 to-cyan-950"></div>
      <div class="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[90px]"></div>
      <!-- Scanline overlay effect -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmZmZmYwNSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none mix-blend-overlay"></div>
    </div>

    <!-- Back Button -->
    <div class="absolute top-8 left-8 z-20 hidden md:block">
      <NuxtLink to="/welcome">
        <button class="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm font-bold">
          <UIcon name="i-material-symbols-arrow-back" class="w-4 h-4" />
          返回边界 (Return)
        </button>
      </NuxtLink>
    </div>

    <!-- Auth Card -->
    <div class="relative z-10 w-full max-w-lg bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-[fade-in-up_0.6s_ease-out]">
      <!-- Decor Ribbon -->
      <div class="absolute top-0 right-10 w-32 h-1 bg-fuchsia-500 shadow-[0_0_15px_#d946ef] rounded-b-md"></div>

      <div class="flex flex-col items-center mb-10">
        <AppLogo class="w-14 h-14 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)] mb-4" />
        <h1 class="text-3xl font-black tracking-wider text-white">协议签署层</h1>
        <span class="text-[10px] font-bold text-fuchsia-400 tracking-[0.3em] uppercase mt-2">Initialize Instance Node • Reg-Process</span>
      </div>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-6">
        
        <!-- Input Group: Username -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">枢纽识别名 (Username)</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UIcon name="i-material-symbols-alternate-email" class="w-5 h-5 text-gray-500" />
            </div>
            <input type="text" v-model="username" required pattern="[A-Za-z0-9_]+"
                   class="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all shadow-inner"
                   placeholder="syskuku">
          </div>
        </div>

        <!-- Input Group: Email -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">通信节点 (Email)</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UIcon name="i-material-symbols-mail" class="w-5 h-5 text-gray-500" />
            </div>
            <input type="email" v-model="email" required
                   class="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all shadow-inner"
                   placeholder="syskuku@asagity.net">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Input Group: Password -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">主访问密钥 (Password)</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-material-symbols-key" class="w-5 h-5 text-gray-500" />
              </div>
              <input type="password" v-model="password" required minlength="8"
                     class="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all shadow-inner"
                     placeholder="••••••••">
            </div>
          </div>

          <!-- Input Group: Confirm Password -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">密钥二次确认</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-material-symbols-lock-reset" class="w-5 h-5 text-gray-500" />
              </div>
              <input type="password" v-model="confirmPassword" required minlength="8"
                     class="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all shadow-inner"
                     placeholder="••••••••">
            </div>
          </div>
        </div>

        <!-- Captcha / Turnstile Placeholder -->
        <div class="w-full bg-white/5 border border-dashed border-gray-600 rounded-2xl py-5 mt-2 flex items-center justify-center relative overflow-hidden group">
          <div class="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <UIcon name="i-material-symbols-verified-user" class="w-4 h-4 text-green-400" /> 
            [ Turnstile / 人机防御网关预留 ]
          </span>
        </div>

        <!-- Submit -->
        <button type="submit" 
                class="w-full mt-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 hover:from-fuchsia-500 hover:to-fuchsia-300 text-gray-900 font-black tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                :disabled="loading || password !== confirmPassword">
          <UIcon v-if="loading" name="i-material-symbols-progress-activity" class="w-5 h-5 animate-spin" />
          {{ loading ? 'INITIALIZING...' : '宣誓并加入 (REGISTER)' }}
        </button>
      </form>

      <!-- Sub text -->
      <div class="mt-8 text-center text-xs text-gray-400 font-medium border-t border-white/10 pt-6">
        已拥有实例访问权限？ 
        <NuxtLink to="/login" class="text-fuchsia-400 font-bold hover:text-fuchsia-300 underline underline-offset-4 decoration-fuchsia-500/30">
          返回信标接入极点 \>
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
