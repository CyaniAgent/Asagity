import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // Set default to false for testing the 'Welcome' page as requested.
  const isLoggedIn = ref(false)
  const username = ref('')
  const avatar = ref('')

  function login(user: string, userAvatar: string) {
    isLoggedIn.value = true
    username.value = user
    avatar.value = userAvatar
  }

  function logout() {
    isLoggedIn.value = false
    username.value = ''
    avatar.value = ''
  }

  return {
    isLoggedIn,
    username,
    avatar,
    login,
    logout
  }
})
