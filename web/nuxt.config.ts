// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@vueuse/motion/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
    dataValue: 'theme',
    storageKey: 'asagity-color-mode'
  },

  runtimeConfig: {
    public: {
      apiBase: ''
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  devServer: {
    host: '::',
    port: 2000
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:2048',
        changeOrigin: true
      },
      '/healthz': {
        target: 'http://localhost:2048/healthz',
        changeOrigin: true
      }
    }
  },

  vite: {
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
