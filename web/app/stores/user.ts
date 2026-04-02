import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCookie } from '#app'

export const useUserStore = defineStore('user', () => {
  // Real token management
  const accessTokenCookie = useCookie<string | null>('asagity_access_token', { maxAge: 60 * 60 * 72 }) // 72h
  const userProfileCookie = useCookie<any | null>('asagity_user_profile')

  const isLoggedIn = ref(!!accessTokenCookie.value)
  const accessToken = ref(accessTokenCookie.value)
  const user = ref<any | null>(userProfileCookie.value)

  const username = computed(() => user.value?.username || '')
  const avatar = computed(() => user.value?.avatar_url || '')

  function setAuth(data: { access_token: string, user: any }) {
    accessToken.value = data.access_token
    accessTokenCookie.value = data.access_token
    user.value = data.user
    userProfileCookie.value = data.user
    isLoggedIn.value = true
  }

  function developerEnter() {
    setAuth({
      access_token: 'dev_mock_token_39',
      user: {
        username: 'Developer',
        name: 'Asagity Dev',
        avatar_url: 'https://avatars.githubusercontent.com/u/739984?v=4'
      }
    })
  }

  function logout() {
    accessToken.value = null
    accessTokenCookie.value = null
    user.value = null
    userProfileCookie.value = null
    isLoggedIn.value = false
  }

  // Action to fetch me on init
  const fetchMe = async () => {
    if (!accessToken.value) return
    
    const api = useApi()
    try {
      const userData = await api.get('/api/auth/me')
      user.value = userData
      userProfileCookie.value = userData
      isLoggedIn.value = true
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      logout()
    }
  }

  return {
    isLoggedIn,
    accessToken,
    user,
    username,
    avatar,
    setAuth,
    developerEnter,
    logout,
    fetchMe
  }
})
