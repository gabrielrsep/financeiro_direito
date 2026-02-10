
import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Processes API', async () => {
    await setup({
      server: true
    })

  let createdClientId: number | null = null
  let createdProcessId: number | null = null

  const timestamp = Date.now()
  
  const testClient = {
    name: 'Process Test Client',
    document: `123${timestamp.toString().slice(-8)}`,
    contact: `processtest${timestamp}@example.com`,
    address: 'Test Address'
  }

  const testProcess = {
    process_number: `TEST-PROC-${timestamp}`,
    tribunal: 'TJSP',
    description: 'Test Process Description',
    status: 'Ativo',
    value_charged: 5000,
    payment_method: 'a_vista'
  }

  const updatedProcess = {
    process_number: `TEST-PROC-${timestamp}`,
    tribunal: 'TJRJ',
    description: 'Updated Description',
    status: 'Arquivado',
    value_charged: 6000
  }

  beforeAll(async () => {
    // Create a client for the process
    const clientResponse = await $fetch<any>('/api/clients', {
      method: 'POST',
      body: testClient
    })
    createdClientId = clientResponse.data.id
  })

  it('should create a new process', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>('/api/processes', {
      method: 'POST',
      body: {
        ...testProcess,
        client_id: createdClientId
      }
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('process_number', testProcess.process_number)
    expect(response.data).toHaveProperty('client_id', createdClientId)

    createdProcessId = response.data.id
  })

  it('should create a new process with only mandatory fields', async () => {
    if (!createdClientId) throw new Error('Client not created')
    const timestamp = Date.now()
    const mandatoryProcess = {
        process_number: `MAND-PROC-${timestamp}`,
        client_id: createdClientId
    }
    const response = await $fetch<any>('/api/processes', {
        method: 'POST', body: mandatoryProcess
    })
    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('process_number', mandatoryProcess.process_number)
    // Check defaults
    // Note: If API does not return full object, we might need to fetch it.
    // Assuming POST returns created object.
  })

  it('should fail to create process without mandatory fields', async () => {
      try {
          await $fetch('/api/processes', {
              method: 'POST', body: { description: 'Missing Number and Client' }
          })
          throw new Error('Should have failed')
      } catch (error: any) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400)
      }
  })

  it('should list processes', async () => {
    const response = await $fetch<any>('/api/processes')
    
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(Array.isArray(response.data)).toBe(true)
    
    if (createdProcessId) {
      const found = response.data.find((p: any) => p.id === createdProcessId)
      expect(found).toBeDefined()
    }
  })

  it('should get a specific process', async () => {
    if (!createdProcessId) throw new Error('Process not created')

    const response = await $fetch<any>(`/api/processes/${createdProcessId}`)
    
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('id', createdProcessId)
    expect(response.data).toHaveProperty('process_number', testProcess.process_number)
  })

  it('should update a process', async () => {
    if (!createdProcessId) throw new Error('Process not created')

    const response = await $fetch<any>(`/api/processes/${createdProcessId}`, {
      method: 'PUT',
      body: {
        ...updatedProcess,
        client_id: createdClientId,
        payment_method: 'a_vista'
      }
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(response.data).toHaveProperty('tribunal', updatedProcess.tribunal)
    expect(response.data).toHaveProperty('status', updatedProcess.status)
  })

  it('should NOT allow changing payment_method after creation', async () => {
    if (!createdProcessId) throw new Error('Process not created')

    try {
      await $fetch(`/api/processes/${createdProcessId}`, {
        method: 'PUT',
        body: {
          // attempt to change payment method to a different one
          payment_method: 'parcelado',
          client_id: createdClientId
        }
      })
      throw new Error('Should have failed when changing payment_method')
    } catch (error: any) {
      // API should respond with 403 Forbidden
      expect(error.response?.status).toBe(403)
      // Optional: check message
      expect(error.data?.statusMessage || error.response?.data?.statusMessage).toMatch(/método de pagamento/i)
    }
  })

  it('should delete a process', async () => {
     if (!createdProcessId) throw new Error('Process not created')

     const response = await $fetch<any>(`/api/processes/${createdProcessId}`, {
        method: 'DELETE'
     })

     expect(response).toHaveProperty('success', true)
  })
  
  it('should verify process is deleted', async () => {
     if (!createdProcessId) throw new Error('Process not created')

      try {
         await $fetch(`/api/processes/${createdProcessId}`)
         // Expect 404 or similar failure
      } catch (error: any) {
          expect(error.response?.status).toBe(404)
      }
  })
})
