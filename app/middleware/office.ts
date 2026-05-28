/**
 * Middleware para proteger rotas relacionadas a offices
 * Permite acesso apenas para usuários cujo office_id = null
 * (administradores/usuários sem office vinculado)
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // Garante que o usuário foi carregado
  if (import.meta.server || !authStore.user) {
    await authStore.fetchUser()
  }

  // Se o usuário não está autenticado, o middleware auth.global.ts cuidará do redirecionamento
  if (!authStore.isAuthenticated) {
    return
  }

  // Verifica se o usuário tem um office_id vinculado
  if (authStore.user?.office_id !== null) {
    // Se tem office_id, não tem permissão para acessar rotas de offices
    return navigateTo('/')
  }
})
