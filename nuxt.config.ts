// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-auth-utils'
  ],
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
