// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: ['@nuxtjs/tailwindcss', process.env.VITEST ? undefined : '@nuxtjs/color-mode', '@pinia/nuxt', '@nuxt/test-utils/module'].filter((m) => m !== undefined),
  colorMode: {
    classSuffix: ''
  }
})