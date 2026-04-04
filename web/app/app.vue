<script setup lang="ts">
import { useInstanceStore } from '~/stores/instance'
import { useUserStore } from '~/stores/user'
import { useSystemStore } from '~/stores/system'

const instanceStore = useInstanceStore()
const userStore = useUserStore()
const systemStore = useSystemStore()

// Restore session on load
onMounted(async () => {
  // Start the background guardian
  systemStore.startHeartbeat()
  
  // Try to restore user session
  await userStore.fetchMe()
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: () => instanceStore.name,
  description: () => instanceStore.description,
  ogTitle: () => instanceStore.name,
  ogDescription: () => instanceStore.description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <AppSplashScreen />
    <AppErrorDialog />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
