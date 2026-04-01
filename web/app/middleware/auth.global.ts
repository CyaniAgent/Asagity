import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  // Define public pages that don't require login
  const publicPages = ['/welcome', '/login', '/register']

  // If not logged in and trying to access a protected page
  if (!userStore.isLoggedIn && !publicPages.includes(to.path)) {
    // Redirect to the Welcome portal
    return navigateTo('/welcome')
  }

  // If already logged in and trying to access welcome/login/register, we might want to redirect to home
  if (userStore.isLoggedIn && publicPages.includes(to.path)) {
    return navigateTo('/')
  }
})
