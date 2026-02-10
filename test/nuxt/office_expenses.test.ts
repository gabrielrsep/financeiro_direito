
import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Office Expenses API', async () => {
    await setup({
      server: true
    })

  let createdExpenseId: number | null = null

  const testExpense = {
    description: 'Test Office Expense',
    amount: 150.50,
    due_date: new Date().toISOString(),
    is_recurrent: false
  }

  const updatedExpense = {
    description: 'Updated Office Expense',
    amount: 200.00
  }

  it('should create a new office expense', async () => {
    const response = await $fetch<any>('/api/office-expenses', {
      method: 'POST',
      body: testExpense
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('id')
    
    createdExpenseId = response.id
  })

  it('should create office expense with only mandatory fields', async () => {
    const mandatoryExpense = {
        description: 'Mandatory Expense',
        amount: 88.88,
        due_date: new Date().toISOString()
    }
    const response = await $fetch<any>('/api/office-expenses', {
        method: 'POST', body: mandatoryExpense
    })
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('id')
  })

  it('should fail to create office expense without mandatory fields', async () => {
      try {
          await $fetch('/api/office-expenses', {
              method: 'POST', body: { description: 'Only Description' }
          })
          throw new Error('Should have failed')
      } catch (error: any) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400)
      }
  })

  it('should list office expenses', async () => {
    const response = await $fetch<any>('/api/office-expenses')
    
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    expect(Array.isArray(response.data)).toBe(true)
  })

  // Note: Update endpoint for office-expenses uses PATCH and expects 'id' in the route
  it('should update an office expense', async () => {
    if (!createdExpenseId) throw new Error('Expense not created')

    const response = await $fetch<any>(`/api/office-expenses/${createdExpenseId}`, {
      method: 'PATCH',
      body: updatedExpense
    })

    expect(response).toHaveProperty('success', true)
  })

  it('should delete an office expense', async () => {
     if (!createdExpenseId) throw new Error('Expense not created')

     const response = await $fetch<any>(`/api/office-expenses/${createdExpenseId}`, {
        method: 'DELETE'
     })

     expect(response).toHaveProperty('success', true)
  })
})
