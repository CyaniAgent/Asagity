<script setup lang="ts">
import { useInstanceStore } from '~/stores/instance'
import { useUserStore } from '~/stores/user'
import { useSystemStore } from '~/stores/system'
import { useThemeStore } from '~/stores/theme'
import { useSoundManager } from '~/stores/soundManager'
import { useContextMenuStore } from '~/stores/contextMenu'

const instanceStore = useInstanceStore()
const userStore = useUserStore()
const systemStore = useSystemStore()
const themeStore = useThemeStore()
const soundManager = useSoundManager()
const contextMenuStore = useContextMenuStore()

onMounted(async () => {
  // BUG FIX: Preload sounds but exclude sys_error for initial check (Plan B)
  if (import.meta.client) {
    soundManager.preloadSounds(['sys_error']).catch(() => { })
  }

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
      systemStore.launchApp()

      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
    window.addEventListener('click', unlockAudio)
    window.addEventListener('touchstart', unlockAudio)
    window.addEventListener('keydown', unlockAudio)

    // 全局右键菜单监听 (Global Context Menu Listener)
    window.addEventListener('contextmenu', (e) => {
      // 如果点击的是输入框或文本域，则允许浏览器默认菜单
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // 寻找最近的链接标签 (Find nearest <a>)
      const anchor = target.closest('a')

      if (anchor) {
        const href = anchor.getAttribute('href') || anchor.href
        // 只有包含有效的 href 才进行特殊处理
        if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
          // 判断是否为内部链接：相对路径，或包含当前 origin
          const isInternal = href.startsWith('/') || href.startsWith(window.location.origin) || !href.includes('://')

          if (isInternal) {
            // 获取路径部分
            let path = href
            if (href.startsWith('http')) {
              try {
                path = new URL(href).pathname
              } catch {
                path = href
              }
            }
            contextMenuStore.open(e, 'link_internal', { path, href: anchor.href })
          } else {
            // 外部链接：获取标题和URL
            const title = anchor.innerText.trim().slice(0, 30) || anchor.getAttribute('title') || '外部链接'
            contextMenuStore.open(e, 'link_external', { url: anchor.href, title })
          }
          return
        }
      }

      contextMenuStore.open(e, 'global')
    })
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
      <AppMobileWelcome />
      <AppTaskWindow />
    </ClientOnly>
    <NuxtLayout v-if="systemStore.hasLaunched && (!systemStore.isMobile || systemStore.isWelcomeDismissed)">
      <NuxtPage />
    </NuxtLayout>

    <!-- 全局右键菜单 (Global Context Menu) -->
    <AppContextMenu />
  </UApp>
</template>
