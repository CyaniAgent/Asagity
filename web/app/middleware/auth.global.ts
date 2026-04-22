import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()

  const systemStore = useSystemStore()

  // Define public pages that don't require login
  const publicPages = ['/', '/welcome', '/login', '/register']

  // Offline Mode constraints
  if (systemStore.isFrontendOnlyMode) {
    const offlineAllowedPaths = ['/', '/settings', '/about']
    if (!offlineAllowedPaths.includes(to.path) && !publicPages.includes(to.path)) {
      if (import.meta.client) {
        const toast = useAppToast()
        toast.add({
          title: '访问受限 (RESTRICTED)',
          description: '仅前端模式下无法访问该功能。',
          color: 'warning',
          icon: 'i-material-symbols-cloud-off-rounded'
        })
      }
      return navigateTo('/')
    }
  }

  // If not logged in and trying to access a protected page
  if (!userStore.isLoggedIn && !publicPages.includes(to.path)) {
    // Redirect to the Welcome portal (now integrated into /)
    return navigateTo('/')
  }

  // If already logged in and trying to access welcome/login/register, redirect to home
  // But don't redirect if we are already at home ('/') to avoid infinite loops
  if (userStore.isLoggedIn && publicPages.includes(to.path) && to.path !== '/') {
    return navigateTo('/')
  }
})
