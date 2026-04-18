import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCookie } from '#app'
import { useSystemStore } from '~/stores/system'

export const useUserStore = defineStore('user', () => {
  const accessTokenCookie = useCookie<string | null>('asagity_access_token', { maxAge: 60 * 30 })
  const refreshTokenCookie = useCookie<string | null>('asagity_refresh_token', { maxAge: 60 * 60 * 24 * 30 })
  const userProfileCookie = useCookie<any | null>('asagity_user_profile')

  const isLoggedIn = ref(!!accessTokenCookie.value)
  const accessToken = ref(accessTokenCookie.value)
  const refreshToken = ref(refreshTokenCookie.value)
  const user = ref<any | null>(userProfileCookie.value)

  const username = computed(() => user.value?.username || '')
  const avatar = computed(() => user.value?.avatar_url || '')

  function setAuth(data: { access_token: string, refresh_token: string, user: any }) {
    accessToken.value = data.access_token
    refreshToken.value = data.refresh_token
    accessTokenCookie.value = data.access_token
    refreshTokenCookie.value = data.refresh_token
    user.value = data.user
    userProfileCookie.value = data.user
    isLoggedIn.value = true
  }

  function developerEnter() {
    setAuth({
      access_token: 'dev_mock_token_39',
      refresh_token: 'dev_mock_refresh_39',
      user: {
        username: 'Developer',
        name: 'Asagity Dev',
        avatar_url: 'https://avatars.githubusercontent.com/u/739984?v=4'
      }
    })
  }

  async function logout() {
    const api = useApi()
    try {
      await api.post('/api/auth/logout')
    } catch {
    }

    accessToken.value = null
    refreshToken.value = null
    accessTokenCookie.value = null
    refreshTokenCookie.value = null
    user.value = null
    userProfileCookie.value = null
    isLoggedIn.value = false
  }

  async function logoutAll() {
    const api = useApi()
    try {
      await api.post('/api/auth/logout-all')
    } catch {
    }

    accessToken.value = null
    refreshToken.value = null
    accessTokenCookie.value = null
    refreshTokenCookie.value = null
    user.value = null
    userProfileCookie.value = null
    isLoggedIn.value = false
  }

  async function refreshAccessToken() {
    const api = useApi()
    try {
      const data = await api.post<{ access_token: string, refresh_token: string, user: any }>('/api/auth/refresh')
      accessToken.value = data.access_token
      refreshToken.value = data.refresh_token
      accessTokenCookie.value = data.access_token
      refreshTokenCookie.value = data.refresh_token
      return true
    } catch {
      return false
    }
  }

  const fetchMe = async () => {
    if (!accessToken.value) return

    if (accessToken.value === 'dev_mock_token_39') {
      isLoggedIn.value = true
      return
    }

    const api = useApi()
    const systemStore = useSystemStore()

    try {
      const userData = await api.get('/api/auth/me')
      user.value = userData
      userProfileCookie.value = userData
      isLoggedIn.value = true
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err)

      const errMsg = err.message || ''
      if (errMsg.toLowerCase().includes('fetch failed') || errMsg.toLowerCase().includes('network error') || errMsg.toLowerCase().includes('failed to fetch')) {
        systemStore.triggerOfflineFallback()
      } else {
        if (accessToken.value === 'dev_mock_token_39') {
          isLoggedIn.value = true
        } else {
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            logout()
          } else {
            await fetchMe()
          }
        }
      }
    }
  }

  return {
    isLoggedIn,
    accessToken,
    refreshToken,
    user,
    username,
    avatar,
    setAuth,
    developerEnter,
    logout,
    logoutAll,
    refreshAccessToken,
    fetchMe
  }
})
