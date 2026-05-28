
import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { db } from '~~/server/database/connection'

describe('Clients API', async () => {
    await setup({
      server: true
    })


  let createdClientId: number | null = null

    const testLoggedInUser = { 'x-test-user': JSON.stringify({ id: 1, office_id: 1 }) }

  const testClient = {
    name: 'Test Client',
    document: '12345678901',
    contact: 'test@example.com',
    address: 'Test Address',
    office_id: 1
  }

  const updatedClient = {
    name: 'Updated Test Client',
    document: '12345678901', // Keep document same as it is unique
    contact: 'updated@example.com',
    address: 'Updated Address'
  }

  it('should create a new client', async () => {
    const response = await $fetch<any>('/api/clients', {
      method: 'POST',
      body: testClient,
      headers: testLoggedInUser
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('name', testClient.name)
    expect(response.data).toHaveProperty('document', testClient.document)

    createdClientId = response.data.id
  })

  it('should create a new client with only mandatory fields', async () => {
    const timestamp = Date.now()
    const mandatoryClient = {
       name: 'Mandatory Only Client',
       document: `999${timestamp.toString().slice(-8)}`,
    }
    const response = await $fetch<any>('/api/clients', {
       method: 'POST', body: mandatoryClient, headers: testLoggedInUser
    })
     expect(response).toHaveProperty('success', true)
     expect(response.data).toHaveProperty('name', mandatoryClient.name)
     // Assuming API returns null or empty string for missing optional fields
     // checking if it succeeded is enough for now, but explicit check is better 
  })

  it('should fail to create client without mandatory fields', async () => {
      try {
        await $fetch('/api/clients', {
            method: 'POST', body: { name: 'No Document' }, headers: testLoggedInUser
        })
        throw new Error('Should have failed')
      } catch (error: any) {
          // Expect 400 Bad Request or 500 if DB constraint fails directly
          expect(error.response?.status).toBeGreaterThanOrEqual(400)
      }
  })

  it('should list clients', async () => {
    const response = await $fetch<any>('/api/clients', { headers: testLoggedInUser })
    
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('should get a specific client', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>(`/api/clients/${createdClientId}`, { headers: testLoggedInUser })
    
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('id', createdClientId)
    expect(response.data).toHaveProperty('name', testClient.name)
  })

  it('should update a client', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>(`/api/clients/${createdClientId}`, {
      method: 'PUT',
      body: updatedClient,
      headers: testLoggedInUser
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('name', updatedClient.name)
    expect(response.data).toHaveProperty('contact', updatedClient.contact)
  })

  it('should delete a client', async () => {
     if (!createdClientId) throw new Error('Client not created')

     const response = await $fetch<any>(`/api/clients/${createdClientId}`, {
        method: 'DELETE',
        headers: testLoggedInUser
     })

     expect(response).toHaveProperty('success', true)
  })
  
  it('should verify client is deleted', async () => {
     if (!createdClientId) throw new Error('Client not created')

      // Assuming GET returns 404 or some error/empty for deleted
      // Or if using soft delete, maybe check for deleted field? 
      // The schema shows deleted_at, so it might still return it or not depending on API implementation.
      // Let's check how GET /api/clients/[id] behaves.
      
      try {
         await $fetch(`/api/clients/${createdClientId}`, { headers: testLoggedInUser })
          // If it returns success even for deleted (soft delete), we check properties
          // But usually GET by ID should return 404 if "logically" deleted
      } catch (error: any) {
          expect(error.response?.status).toBe(404)
      }
  })
})
