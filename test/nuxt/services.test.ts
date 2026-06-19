import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { getAuthCookie, setCurrentUser } from '../util'

const userLogeedIn = { id: 25, name: 'Test User', office_id: 1 }

describe('Services API', async () => {
    await setup({
      server: true
    })

  let createdClientId: number | null = null
  let createdServiceId: number | null = null

  const timestamp = Date.now()
  
  const testClient = {
    name: 'Service Test Client',
    document: `456${timestamp.toString().slice(-8)}`,
    contact: `servicetest${timestamp}@example.com`,
    address: 'Test Address'
  }

  const testService = {
    description: 'Consulting Service',
    value_charged: 2000,
    payment_method: 'pix'
  }

  const updatedService = {
    description: 'Updated Consulting Service',
    value_charged: 2500,
    payment_method: 'cartao'
  }

  beforeAll(async () => {
    setCurrentUser(userLogeedIn)
    // Create a client for the service
    const clientResponse = await $fetch<any>('/api/clients', {
      method: 'POST',
      body: testClient,
      headers: await getAuthCookie()
    })
    createdClientId = clientResponse.data.id
  })

  it('should create a new service', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>('/api/services', {
      method: 'POST',
      body: {
        ...testService,
        client_id: createdClientId
      }, headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('description', testService.description)
    expect(response.data).toHaveProperty('client_id', createdClientId)
    expect(response.data).toHaveProperty('value_charged', testService.value_charged)
    expect(response.data).toHaveProperty('status', 'Ativo')

    createdServiceId = response.data.id
  })

  it('should fail to create service without mandatory fields', async () => {
      try {
          await $fetch('/api/services', {
              method: 'POST', 
              body: { description: 'Missing client_id and value' },
              headers: await getAuthCookie()
          })
          throw new Error('Should have failed')
      } catch (error: any) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400)
      }
  })

  it('should list services', async () => {
    const response = await $fetch<any>('/api/services', { headers: await getAuthCookie() })
    
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(Array.isArray(response.data)).toBe(true)
    expect(response).toHaveProperty('meta')
    expect(response.meta).toHaveProperty('total')
    expect(response.meta).toHaveProperty('page')
    expect(response.meta).toHaveProperty('limit')
  })

  it('should list services with pagination', async () => {
    const response = await $fetch<any>('/api/services', {
      query: {
        page: 1,
        limit: 5
      },
      headers: await getAuthCookie()
    })
    
    expect(response).toHaveProperty('success', true)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.meta.page).toBe(1)
    expect(response.data.length).toBeLessThanOrEqual(5)
  })

  it('should filter services by clientId', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>('/api/services', {
      query: {
        clientId: createdClientId
      },
      headers: await getAuthCookie()
    })
    
    expect(response).toHaveProperty('success', true)
    expect(response.data).toBeDefined()
  })

  it('should filter services by status', async () => {
    const response = await $fetch<any>('/api/services', {
      query: {
        status: 'Ativo'
      },
      headers: await getAuthCookie()
    })
    
    expect(response).toHaveProperty('success', true)
    if (response.data.length > 0) {
      expect(response.data.every((s: any) => s.status === 'Ativo')).toBe(true)
    }
  })

  it('should get service details', async () => {
    if (!createdServiceId) throw new Error('Service not created')

    const response = await $fetch<any>(`/api/services/${createdServiceId}`, { headers: await getAuthCookie() })
    
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('id', createdServiceId)
    expect(response.data).toHaveProperty('description', testService.description)
    expect(response.data).toHaveProperty('payments', [])
    expect(response.data).toHaveProperty('summary')
    expect(response.data.summary).toHaveProperty('value_charged')
    expect(response.data.summary).toHaveProperty('total_paid')
    expect(response.data.summary).toHaveProperty('balance')
  })

  it('should fail to get non-existent service', async () => {
    try {
      await $fetch('/api/services/99999', { headers: await getAuthCookie() })
      throw new Error('Should have failed')
    } catch (error: any) {
      expect(error.response?.status).toBe(404)
    }
  })

  it('should update a service', async () => {
    if (!createdServiceId) throw new Error('Service not created')

    const response = await $fetch<any>(`/api/services/${createdServiceId}`, {
      method: 'PUT',
      body: updatedService,
      headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('message')

    // Verify the update
    const updatedData = await $fetch<any>(`/api/services/${createdServiceId}`, { headers: await getAuthCookie() })
    expect(updatedData.data).toHaveProperty('description', updatedService.description)
    expect(updatedData.data).toHaveProperty('value_charged', updatedService.value_charged + ".00")
  })

  it('should update only specific fields', async () => {
    if (!createdServiceId) throw new Error('Service not created')

    const response = await $fetch<any>(`/api/services/${createdServiceId}`, {
      method: 'PUT',
      body: {
        description: 'Another Update',
        status: 'Concluído'
      },
      headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)

    // Verify partial update
    const updatedData = await $fetch<any>(`/api/services/${createdServiceId}`, { headers: await getAuthCookie() })
    expect(updatedData.data.description).toBe('Another Update')
    expect(updatedData.data.status).toBe('Concluído')
  })

  it('should delete a service', async () => {
    if (!createdServiceId) throw new Error('Service not created')

    const response = await $fetch<any>(`/api/services/${createdServiceId}`, {
      method: 'DELETE',
      headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('message')

    // Verify deletion (soft delete)
    try {
      await $fetch(`/api/services/${createdServiceId}`, { headers: await getAuthCookie() })
      throw new Error('Should have failed')
    } catch (error: any) {
      expect(error.response?.status).toBe(404)
    }
  })

  it('should fail to delete non-existent service', async () => {
    try {
      await $fetch('/api/services/99999', {
        method: 'DELETE',
        headers: await getAuthCookie()
      })
      throw new Error('Should have failed')
    } catch (error: any) {
      expect(error.response?.status).toBe(404)
    }
  })

  // Service + Payment Integration Tests
  it('should create payment for a service', async () => {
    if (!createdClientId) throw new Error('Client not created')

    // Create a new service first
    const serviceResponse = await $fetch<any>('/api/services', {
      method: 'POST',
      body: {
        description: 'Service for Payment Test',
        value_charged: 1500,
        payment_method: 'em_conta',
        client_id: createdClientId,
      } , headers: await getAuthCookie()
    })

    const serviceId = serviceResponse.data.id

    // Create a payment for this service
    const paymentResponse = await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        service_id: serviceId,
        value_paid: 500,
        type: 'payment'
      } as Payment, headers: await getAuthCookie()
    })

    expect(paymentResponse).toHaveProperty('success', true)
    expect(paymentResponse).toHaveProperty('data')

    // Verify payment is linked to service
    const serviceDetails = await $fetch<any>(`/api/services/${serviceId}`, { headers: await getAuthCookie() })
    expect(serviceDetails.data.payments.length).toBeGreaterThan(0)
    expect(serviceDetails.data.summary.total_paid).toBe(500)
    expect(serviceDetails.data.summary.balance).toBe(1000)

    // Pay the remainder and ensure all_paid_at is set
    await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        service_id: serviceId,
        value_paid: 1000,
        type: 'payment'
      } as Payment, headers: await getAuthCookie()
    })

    const fullyPaidDetails = await $fetch<any>(`/api/services/${serviceId}`, { headers: await getAuthCookie() })
    expect(fullyPaidDetails.data.is_fully_paid).toBe(true)
  })

  it('should list client services', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>(`/api/clients/${createdClientId}`, { headers: await getAuthCookie() })
    
    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('services')
    expect(Array.isArray(response.data.services)).toBe(true)
  })
})
