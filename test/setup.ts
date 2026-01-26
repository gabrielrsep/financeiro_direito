import { registerEndpoint } from '@nuxt/test-utils/runtime'

// Mock global para a rota de auth
// Isso vai impedir o erro 404 em todos os testes que acionam o middleware
registerEndpoint('/api/auth/check-setup', () => {
  return {
    needsSetup: false // Retorne o que o seu front-end espera receber
  }
})
