import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { getAuthCookie, setCurrentUser } from '../util'

const userLogeedIn = { id: 25, name: 'Test User', office_id: 1 }

describe('Schedules API', async () => {
    await setup({
      server: true
    })

  setCurrentUser(userLogeedIn)
  let createdClientId: number | null = null
  let createdProcessId: number | null = null

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
      body: testClient, headers: await getAuthCookie()
    })
    createdClientId = clientResponse.data.id

    // Create process
    const processResponse = await $fetch<any>('/api/processes', {
      method: 'POST',
      body: {
        ...testProcess,
        client_id: createdClientId
      }, headers: await getAuthCookie()
    })
    createdProcessId = processResponse.data.id
  })

  it('should create a schedule for a process', async () => {
    if (!createdProcessId) throw new Error('Process not created')

    const response = await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        process_id: createdProcessId,
        value_paid: testSchedule.amount,
        payment_date: testSchedule.movement_date,
        description: testSchedule.description,
        type: 'charge'
      }, headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('value_paid', testSchedule.amount)
    expect(response.data).toHaveProperty('payment_date', testSchedule.movement_date)

  })

  it('should create a schedule directly for a client', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        client_id: createdClientId,
        value_paid: 500,
        payment_date: new Date().toISOString().split('T')[0],
        description: 'Direct client schedule',
        type: 'charge'
      }, headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('client_id', createdClientId)
    expect(response.data).toHaveProperty('type', 'charge')
    expect(response.data).toHaveProperty('value_paid', 500)
  })

  it('should create schedule with only mandatory fields', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    
    const response = await $fetch<any>('/api/payments', {
        method: 'POST',
        body: {
            process_id: createdProcessId,
            value_paid: 250,
            payment_date: new Date().toISOString().split('T')[0],
            type: 'charge'
        }, headers: await getAuthCookie()
    })
    
    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('value_paid', 250)
    expect(response.data).toHaveProperty('type', 'charge')
  })
  
  it('should fail to create schedule without amount', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    
    try {
        await $fetch('/api/payments', {
            method: 'POST',
            body: {
                process_id: createdProcessId,
                payment_date: new Date().toISOString().split('T')[0],
                type: 'charge'
            }, headers: await getAuthCookie()
        })
        throw new Error('Should have failed')
    } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
    }
  })

  it('should fail to create schedule without any linked entity', async () => {
    try {
        await $fetch('/api/payments', {
            method: 'POST',
            body: {
                value_paid: 100,
                payment_date: new Date().toISOString().split('T')[0],
                type: 'charge'
            } as Payment, headers: await getAuthCookie()
        })
        throw new Error('Should have failed')
    } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
    }
  })

  it('should fail to create schedule with zero or negative amount', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    
    try {
        await $fetch('/api/payments', {
            method: 'POST',
            body: {
                process_id: createdProcessId,
                value_paid: 0,
                payment_date: new Date().toISOString().split('T')[0],
                type: 'charge'
            } as Payment, headers: await getAuthCookie()
        })
        throw new Error('Should have failed')
    } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
    }
  })

  it('should get schedule history', async () => {
    const response = await $fetch<any>('/api/payments/history?page=1&limit=10&type=charge', {  headers: await getAuthCookie() })

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
    
    const response = await $fetch<any>(`/api/payments/history?type=charge&page=1&limit=10&clientId=${createdClientId}`, { headers: await getAuthCookie() })

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
    
    const response = await $fetch<any>(`/api/payments/history?page=1&limit=10&startDate=${today}&endDate=${tomorrow}&type=charge`, { headers: await getAuthCookie() })

    expect(response).toHaveProperty('success', true)
    expect(Array.isArray(response.data)).toBe(true)
  })
})
