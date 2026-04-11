<script setup lang="ts">
import { useInstanceStore } from '~/stores/instance'
import { useUserStore } from '~/stores/user'
import { useSystemStore } from '~/stores/system'
import { useThemeStore } from '~/stores/theme'

const instanceStore = useInstanceStore()
const userStore = useUserStore()
const systemStore = useSystemStore()
const themeStore = useThemeStore()

onMounted(async () => {
  themeStore.init()

  await systemStore.initSequence()

  try {
    await userStore.fetchMe()
  } catch {
    console.warn('Session restoration skipped or failed')
  }

  // GLOBAL AUDIO UNLOCKER: Unlock audio on the very first user interaction
  if (import.meta.client) {
    const unlockAudio = () => {
      systemStore.launchApp() // Re-run launch logic to ensure context is warm
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
    window.addEventListener('click', unlockAudio)
    window.addEventListener('touchstart', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
  }
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
    <ClientOnly>
      <AppErrorDialog />
      <AppTaskWindow />
    </ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
