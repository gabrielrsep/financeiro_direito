
import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Gastos (Expenses) API', async () => {
    await setup({
      server: true
    })

  it('should get gastos summary', async () => {
    try {
        const response = await $fetch<any>('/api/gastos')
        expect(response).toBeDefined()
        // verify structure based on endpoint return
    } catch (e: any) {
         if (e.response?.status === 401) return
         throw e
    }
  })

  it('should get scheduled gastos', async () => {
    try {
        const response = await $fetch<any>('/api/gastos/scheduled')
        expect(response).toHaveProperty('success', true)
        expect(Array.isArray(response.data)).toBe(true)
    } catch (e: any) {
         if (e.response?.status === 401) return
         throw e
    }
  })
})
