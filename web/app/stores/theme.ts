import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ColorMode = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ColorMode>('system')
  const systemPreference = ref<'light' | 'dark'>('dark')

  const isDark = computed(() => {
    if (preference.value === 'system') {
      return systemPreference.value === 'dark'
    }
    return preference.value === 'dark'
  })

  const currentMode = computed(() => {
    if (preference.value === 'system') {
      return systemPreference.value
    }
    return preference.value
  })

  const modeLabel = computed(() => {
    switch (preference.value) {
      case 'light':
        return '浅色'
      case 'dark':
        return '深色'
      case 'system':
        return '跟随系统'
      default:
        return '跟随系统'
    }
  })

  function init() {
    if (import.meta.client) {
      const stored = localStorage.getItem('asagity-color-mode') as ColorMode | null
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        preference.value = stored
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemPreference.value = mediaQuery.matches ? 'dark' : 'light'

      mediaQuery.addEventListener('change', (e) => {
        systemPreference.value = e.matches ? 'dark' : 'light'
        applyColorMode()
      })

      applyColorMode()
    }
  }

  function applyColorMode() {
    if (import.meta.client) {
      const root = document.documentElement
      const isDarkMode = isDark.value

      root.classList.remove('light', 'dark')
      root.classList.add(isDarkMode ? 'dark' : 'light')
      root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    }
  }

  function setPreference(mode: ColorMode) {
    preference.value = mode
    if (import.meta.client) {
      localStorage.setItem('asagity-color-mode', mode)
      applyColorMode()
    }
  }

  function toggle() {
    if (preference.value === 'system') {
      setPreference(currentMode.value === 'dark' ? 'light' : 'dark')
    } else {
      setPreference(preference.value === 'dark' ? 'light' : 'dark')
    }
  }

  watch(preference, () => {
    applyColorMode()
  })

  return {
    preference,
    systemPreference,
    isDark,
    currentMode,
    modeLabel,
    init,
    setPreference,
    toggle
  }
})
