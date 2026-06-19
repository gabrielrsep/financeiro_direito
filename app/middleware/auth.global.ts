const publicPaths = ['/login', '/setup', '/password-recovery', '/reset-password']

type SetupObject = {
  needsSetup: boolean
}

export default defineNuxtRouteMiddleware(async to => {

  const { loggedIn } = useUserSession()

  let checkSetup: SetupObject = { needsSetup: false }
  
  // 1. Setup Logic
  if (!loggedIn.value || to.path === '/setup') {
    const data = await $fetch<SetupObject>('/api/auth/check-setup')
    checkSetup = data
  }
  
  // If setup is needed and we are not on /setup, go to /setup
  if (checkSetup.needsSetup && to.path !== '/setup') {
    return navigateTo('/setup')
  }

  // If setup is NOT needed and we are on /setup, go home
  if (!checkSetup.needsSetup && to.path === '/setup') {
    return navigateTo('/')
  }
// End setup logic

  // Standard Auth logic
  if (!loggedIn.value && !publicPaths.includes(to.path)) {
    return navigateTo('/login')
  }

  if (loggedIn.value && to.path === '/login') {
    return navigateTo('/')
  }
})
