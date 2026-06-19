/**
 * Middleware para proteger rotas relacionadas a offices
 * Permite acesso apenas para usuários cujo office_id = null
 * (administradores/usuários sem office vinculado)
 */
export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, user } = useUserSession()


  if(!loggedIn.value) {
    return undefined
  }


  // Verifica se o usuário tem um office_id vinculado
  if (user.value?.office_id !== null) {
    // Se tem office_id, não tem permissão para acessar rotas de offices
    return navigateTo('/')
  }
})
