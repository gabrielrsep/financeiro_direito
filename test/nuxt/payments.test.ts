
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch, setup, fetch } from '@nuxt/test-utils/e2e'
import { getAuthCookie, setCurrentUser } from '../util'
import NodeFormData from 'form-data'
import { neon } from '@neondatabase/serverless'

describe('Payments API', async () => {




  await setup({
    server: true,
  })

  let createdClientId: number | null = null
  let createdProcessId: number | null = null
  let createdFinalPaymentId: number | null = null
  let createdUserId: number | null = null

  const timestamp = Date.now()
  const testClient = {
    name: 'Payment Test Client',
    document: `123${timestamp.toString().slice(-8)}`, // Random valid-ish document
    contact: `paymenttest${timestamp}@example.com`,
    address: 'Test Address',
  }

  const testProcess = {
    process_number: `PAY-PROC-${timestamp}`,
    description: 'Payment Test Process',
    value_charged: 1000,
    office_id: 1
  }

  const testPayment = {
    value_paid: 100,
    payment_date: new Date().toISOString(),
    status: 'Pago'
  }

  const user = {
    username: `admin_test_${Date.now()}`,
    email: `admin_test_${Date.now()}@example.com`,
    password: 'password123',
    name: 'abcd'
  }

  beforeAll(async () => {
    setCurrentUser({ id: 333333, office_id: 1 })
    const formData = new NodeFormData()

    formData.append('name', user.name)
    formData.append('username', user.username)
    formData.append('email', user.email)
    formData.append('password', user.password)

    const userResponse = await fetch('/api/users', {
      method: 'POST',
      body: formData.getBuffer() as any,
      headers: { ...formData.getHeaders(), ...(await getAuthCookie()),  }
    })

    const uResponse = await userResponse.json()
    createdUserId = uResponse.id

    setCurrentUser(uResponse)

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
  
  it('should create a payment for a process', async () => {
    if (!createdProcessId) throw new Error('Process not created')

    const response = await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        process_id: createdProcessId,
        value_paid: testPayment.value_paid,
        payment_date: testPayment.payment_date,
        type: 'payment'
      }, headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('process_id', createdProcessId)
    expect(response.data).toHaveProperty('value_paid', testPayment.value_paid)

  })

  it('should mark process as paid when fully paid', async () => {
    if (!createdProcessId) throw new Error('Process not created')

    const response = await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        process_id: createdProcessId,
        value_paid: 900,
        payment_date: new Date().toISOString(),
        type: 'payment'
      }, headers: await getAuthCookie()
    })

    createdFinalPaymentId = response.data.id

    const processDetails = await $fetch<any>(`/api/processes/${createdProcessId}`)
    expect(processDetails.data.is_fully_paid).toBe(true)
  })

  it('should create a payment directly for a client', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        client_id: createdClientId,
        value_paid: 200,
        payment_date: new Date().toISOString(),
        type: 'payment'
      }, headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('client_id', createdClientId)
    expect(response.data).toHaveProperty('value_paid', 200)
    
    // We don't store this ID for deletion test to keep it simple, or we could.
  })

  it('should create payment with only mandatory fields', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    const response = await $fetch<any>('/api/payments', {
        method: 'POST',
        body: {
          process_id: createdProcessId,
          value_paid: 50,
          type: 'payment'
        }, headers: await getAuthCookie()
    })
    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('value_paid', 50)
  })
  
  it('should fail to create payment without mandatory fields', async () => {
       try {
          await $fetch('/api/payments', {
              method: 'POST', body: { value_paid: 50, }, headers: await getAuthCookie()
          })
          throw new Error('Should have failed')
      } catch (error: any) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400)
      }
  })

  it('should list payments history', async () => {
    const res = await $fetch<any>('/api/payments/history', {query: {type: 'payment'}, headers: await getAuthCookie() })
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThan(0)
  })

  it('should list payments history with filters', async () => {
    if (!createdClientId) throw new Error('Client not created')
    
    const res = await $fetch<any>('/api/payments/history', {
        query: { clientId: createdClientId, type: 'payment' },
        headers: await getAuthCookie()
    })
    expect(res.success).toBe(true)
  })

  it('should delete a payment', async () => {
      if (!createdFinalPaymentId) throw new Error('Payment not created')

      setCurrentUser({id: 9999, office_id: null})

      const response = await $fetch<any>(`/api/payments/${createdFinalPaymentId}`, {
        method: 'DELETE',
        headers: await getAuthCookie()
     })

     expect(response).toHaveProperty('success', true)

      if (createdProcessId) {
       const processDetails = await $fetch<any>(`/api/processes/${createdProcessId}`)
       expect(processDetails.data.is_fully_paid).toBe(false)
      }
  })
})
