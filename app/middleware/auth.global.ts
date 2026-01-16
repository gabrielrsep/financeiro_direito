export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // 1. Initial user check
  if (import.meta.server || !authStore.user) {
    await authStore.fetchUser()
  }

  // 2. Setup check (only if not authenticated or specifically on /setup)
  // We check if setup is needed if we're not authenticated OR if we are on the /setup path
  if (!authStore.isAuthenticated || to.path === '/setup') {
    await authStore.checkSetup()
  }

  // 3. Redirection logic
  
  // If setup is needed and we are not on /setup, go to /setup
  if (authStore.needsSetup && to.path !== '/setup') {
    return navigateTo('/setup')
  }

  // If setup is NOT needed and we are on /setup, go home
  if (!authStore.needsSetup && to.path === '/setup') {
    return navigateTo('/')
  }

  // Standard Auth logic
  if (!authStore.isAuthenticated && to.path !== '/login' && to.path !== '/setup') {
    return navigateTo('/login')
  }

  if (authStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
