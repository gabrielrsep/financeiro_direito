import { defineStore } from 'pinia'

export type StorangeUser = {
  id: string
  name: string
  email: string
  avatar_url: string,
  office_name: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<StorangeUser | null>(null)
  const needsSetup = ref<boolean>(false)
  const isAuthenticated = computed(() => !!user.value)

  async function fetchUser() {
    try {
      const headers = useRequestHeaders(['cookie']) as Record<string, string>
      const data = await $fetch<{ user: StorangeUser }>('/api/auth/user', { headers })
      user.value = data.user
    } catch (error) {
      user.value = null
    }
  }

  async function login(credentials: { identifier: string, password: string }) {
    try {
      const data = await $fetch<{ user: StorangeUser }>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      })
      user.value = data.user
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Ocorreu um erro ao fazer login.'
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
