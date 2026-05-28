import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

const userLogeedIn = {'x-test-user': JSON.stringify({ id: 1, name: 'Test User', office_id: 1 })}

describe('Schedules API', async () => {
    await setup({
      server: true
    })

  let createdClientId: number | null = null
  let createdProcessId: number | null = null
  let createdScheduleId2: number | null = null

  const timestamp = Date.now()
  const testClient = {
    name: 'Schedule Test Client',
    document: `456${timestamp.toString().slice(-8)}`, // Random valid-ish document
    contact: `scheduletest${timestamp}@example.com`,
    address: 'Test Address'
  }

  const testProcess = {
    process_number: `SCHED-PROC-${timestamp}`,
    description: 'Schedule Test Process',
    value_charged: 5000
  }

  const testSchedule = {
    amount: 1000,
    movement_date: new Date().toISOString().split('T')[0],
    description: 'Test Schedule'
  }

  beforeAll(async () => {
    // Create client
    const clientResponse = await $fetch<any>('/api/clients', {
      method: 'POST',
      body: testClient, headers: userLogeedIn
    })
    createdClientId = clientResponse.data.id

    // Create process
    const processResponse = await $fetch<any>('/api/processes', {
      method: 'POST',
      body: {
        ...testProcess,
        client_id: createdClientId
      }, headers: userLogeedIn
    })
    createdProcessId = processResponse.data.id
  })

  it('should create a schedule for a process', async () => {
    if (!createdProcessId) throw new Error('Process not created')

    const response = await $fetch<any>('/api/schedules', {
      method: 'POST',
      body: {
        process_id: createdProcessId,
        amount: testSchedule.amount,
        movement_date: testSchedule.movement_date,
        description: testSchedule.description
      }, headers: userLogeedIn
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('type', 'charge')
    expect(response.data).toHaveProperty('amount', testSchedule.amount)
    expect(response.data).toHaveProperty('movement_date', testSchedule.movement_date)

  })

  it('should create a schedule directly for a client', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>('/api/schedules', {
      method: 'POST',
      body: {
        client_id: createdClientId,
        amount: 500,
        movement_date: new Date().toISOString().split('T')[0],
        description: 'Direct client schedule'
      }, headers: userLogeedIn
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('client_id', createdClientId)
    expect(response.data).toHaveProperty('type', 'charge')
    expect(response.data).toHaveProperty('amount', 500)
  })

  it('should create schedule with only mandatory fields', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    
    const response = await $fetch<any>('/api/schedules', {
        method: 'POST',
        body: {
            process_id: createdProcessId,
            amount: 250,
            movement_date: new Date().toISOString().split('T')[0]
        }, headers: userLogeedIn
    })
    
    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('amount', 250)
    expect(response.data).toHaveProperty('type', 'charge')
    createdScheduleId2 = response.data.id
  })
  
  it('should fail to create schedule without amount', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    
    try {
        await $fetch('/api/schedules', {
            method: 'POST',
            body: {
                process_id: createdProcessId,
                movement_date: new Date().toISOString().split('T')[0]
            }, headers: userLogeedIn
        })
        throw new Error('Should have failed')
    } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
    }
  })

  it('should fail to create schedule without movement_date', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    
    try {
        await $fetch('/api/schedules', {
            method: 'POST',
            body: {
                process_id: createdProcessId,
                amount: 100
            }, headers: userLogeedIn
        })
        throw new Error('Should have failed')
    } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
    }
  })

  it('should fail to create schedule without any linked entity', async () => {
    try {
        await $fetch('/api/schedules', {
            method: 'POST',
            body: {
                amount: 100,
                movement_date: new Date().toISOString().split('T')[0]
            }, headers: userLogeedIn
        })
        throw new Error('Should have failed')
    } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
    }
  })

  it('should fail to create schedule with zero or negative amount', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    
    try {
        await $fetch('/api/schedules', {
            method: 'POST',
            body: {
                process_id: createdProcessId,
                amount: 0,
                movement_date: new Date().toISOString().split('T')[0]
            }, headers: userLogeedIn
        })
        throw new Error('Should have failed')
    } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
    }
  })

  it('should get schedule history', async () => {
    const response = await $fetch<any>('/api/schedules/history?page=1&limit=10', { headers: userLogeedIn })

    expect(response).toHaveProperty('success', true)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response).toHaveProperty('meta')
    expect(response.meta).toHaveProperty('total')
    expect(response.meta).toHaveProperty('page')
    expect(response.meta).toHaveProperty('limit')
    expect(response.meta).toHaveProperty('totalPages')
    
    // Check that all returned items are charges
    for (const item of response.data) {
        expect(item.type).toBe('charge')
    }
  })

  it('should filter schedule history by client_id', async () => {
    if (!createdClientId) throw new Error('Client not created')
    
    const response = await $fetch<any>(`/api/schedules/history?page=1&limit=10&clientId=${createdClientId}`, { headers: userLogeedIn })

    expect(response).toHaveProperty('success', true)
    expect(Array.isArray(response.data)).toBe(true)
    
    // All returned schedules should belong to this client
    for (const item of response.data) {
        expect(item.client_id.toString()).toBe(createdClientId.toString())
    }
  })

  it('should filter schedule history by date range', async () => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    
    const response = await $fetch<any>(`/api/schedules/history?page=1&limit=10&startDate=${today}&endDate=${tomorrow}`, { headers: userLogeedIn })

    expect(response).toHaveProperty('success', true)
    expect(Array.isArray(response.data)).toBe(true)
  })
})
