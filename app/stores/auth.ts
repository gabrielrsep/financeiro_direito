import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const needsSetup = ref<boolean>(false)
  const isAuthenticated = computed(() => !!user.value)

  async function fetchUser() {
    try {
      const data = await $fetch<{ user: any }>('/api/auth/user')
      user.value = data.user
    } catch (error) {
      user.value = null
    }
  }

  async function login(credentials: { identifier: string, password: string }) {
    try {
      const data = await $fetch<{ user: any }>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      })
      user.value = data.user
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.statusMessage || 'Ocorreu um erro ao fazer login.'
      }
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      navigateTo('/login')
    } catch (error) {
      console.error('Erro ao fazer logout', error)
    }
  }

  async function checkSetup() {
    try {
      const data = await $fetch<{ needsSetup: boolean }>('/api/auth/check-setup')
      needsSetup.value = data.needsSetup
      return data.needsSetup
    } catch (error) {
      console.error('Erro ao verificar setup', error)
      return false
    }
  }

  return {
    user,
    isAuthenticated,
    needsSetup,
    fetchUser,
    login,
    logout,
    checkSetup
  }
})
