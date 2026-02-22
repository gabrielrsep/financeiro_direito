// https://nuxt.com/docs/api/configuration/nuxt-config

const { NODE_ENV } = process.env
const isTest = NODE_ENV === 'test' || process.env.VITEST === 'true'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  sourcemap: NODE_ENV === "development" ? true : false,
  modules: [
    '@nuxtjs/tailwindcss',
    !isTest && '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@nuxt/test-utils/module',
  ].filter(Boolean),
  colorMode: {
    classSuffix: ''
  },
  nitro: {
    ignore: NODE_ENV === "development" ? [] : ["/api/dev/**"]
  },
  app: {
    head: {
      title: 'Lei & $',
      titleTemplate: '%s | Lei & $',
    }
  }
})