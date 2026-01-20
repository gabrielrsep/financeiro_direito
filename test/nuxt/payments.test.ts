
import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Payments API', async () => {
    await setup({
      server: true
    })

  let createdClientId: number | null = null
  let createdProcessId: number | null = null
  let createdPaymentId: number | null = null

  const timestamp = Date.now()
  const testClient = {
    name: 'Payment Test Client',
    document: `123${timestamp.toString().slice(-8)}`, // Random valid-ish document
    contact: `paymenttest${timestamp}@example.com`,
    address: 'Test Address'
  }

  const testProcess = {
    process_number: `PAY-PROC-${timestamp}`,
    description: 'Payment Test Process',
    value_charged: 1000
  }

  const testPayment = {
    value_paid: 100,
    payment_date: new Date().toISOString(),
    status: 'Pago'
  }

  beforeAll(async () => {
    // Create client
    const clientResponse = await $fetch<any>('/api/clients', {
      method: 'POST',
      body: testClient
    })
    createdClientId = clientResponse.data.id

    // Create process
    const processResponse = await $fetch<any>('/api/processes', {
      method: 'POST',
      body: {
        ...testProcess,
        client_id: createdClientId
      }
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
        status: testPayment.status
      }
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('process_id', createdProcessId)
    expect(response.data).toHaveProperty('value_paid', testPayment.value_paid)

    createdPaymentId = response.data.id
  })

  it('should create a payment directly for a client', async () => {
    if (!createdClientId) throw new Error('Client not created')

    const response = await $fetch<any>('/api/payments', {
      method: 'POST',
      body: {
        client_id: createdClientId,
        value_paid: 200,
        payment_date: new Date().toISOString(),
        status: 'Pago'
      }
    })

    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('client_id', createdClientId)
    expect(response.data).toHaveProperty('value_paid', 200)
    
    // We don't store this ID for deletion test to keep it simple, or we could.
  })

  it('should create payment with only mandatory fields', async () => {
    if (!createdProcessId) throw new Error('Process not created')
    const response = await $fetch<any>('/api/payments', {
        method: 'POST', body: {
            process_id: createdProcessId,
            value_paid: 50
        }
    })
    expect(response).toHaveProperty('success', true)
    expect(response.data).toHaveProperty('value_paid', 50)
  })
  
  it('should fail to create payment without mandatory fields', async () => {
       try {
          await $fetch('/api/payments', {
              method: 'POST', body: { status: 'Pago' }
          })
          throw new Error('Should have failed')
      } catch (error: any) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400)
      }
  })

  it('should delete a payment', async () => {
     if (!createdPaymentId) throw new Error('Payment not created')

     // Note: Payments API uses DELETE method with body, or query param?
     // Based on previous analysis, it uses body with { id }.
     // Some HTTP clients/servers strictly forbid body in DELETE.
     // Nuxt $fetch supports it if using 'body' prop.

     const response = await $fetch<any>('/api/payments', {
        method: 'DELETE',
        body: { id: createdPaymentId }
     })

     expect(response).toHaveProperty('success', true)
  })
})
