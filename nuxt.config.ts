// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'nuxt-auth-utils'
  ],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'dark',
    storageKey: 'tcg_color_mode'
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchup_tracking',
    session: {
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    },
    public: {
      appName: 'TCG Matchup Tracking'
    }
  }
})
