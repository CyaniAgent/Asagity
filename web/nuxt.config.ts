// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@vueuse/motion/nuxt',
    'nuxt-icon'
  ],

  ui: {
    icons: ['ic', 'lucide', 'material-symbols', 'simple-icons']
  },

  fonts: false,

  compatibilityDate: '2025-01-15',

  vite: {
    server: {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* ws://localhost:*; frame-src 'self' blob:; block-all-mixed-content; upgrade-insecure-requests"
      }
    },
    optimizeDeps: {
      include: [
        'date-fns',
        'date-fns/locale',
        'mfm-js',
        'music-metadata',
        'lrc-kit',
        'echarts/core',
        'echarts/renderers',
        'echarts/charts',
        'echarts/components',
        'vue-echarts'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
