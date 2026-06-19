// https://nuxt.com/docs/api/configuration/nuxt-config

const { NODE_ENV } = process.env
const isTest = NODE_ENV === 'test' || process.env.VITEST === 'true'

const modules: string[] = [
  '@nuxtjs/tailwindcss',
  'nuxt-auth-utils',
  '@pinia/nuxt',
  '@nuxt/test-utils/module'
]

if(!isTest)
  modules.push('@nuxtjs/color-mode')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/tailwind.css'],
  sourcemap: NODE_ENV === "development",
  modules,
  nitro: {
    ignore: NODE_ENV === "development" ? [] : ["/api/dev/**"]
  },
  app: {
    head: {
      title: 'Lei & $',
      titleTemplate: '%s | Lei & $',
    }
  },
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 // a day
    }
  }
})