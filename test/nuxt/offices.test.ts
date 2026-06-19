import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import bcrypt from 'bcrypt'
import { neonClient as sql } from '../../server/database/connection'
import { getAuthCookie, setCurrentUser } from '../util'
  
describe('Offices API', async () => {
  await setup({ server: true })

  let createdOfficeId: number = 0
  
  
  it('should not create office', async () => {
    setCurrentUser({ id: 1, office_id: 1 })
    try {
      await $fetch<any>('/api/offices', {
        method: 'POST',
        body: { name: 'Escritório Testefsdf' },
        headers: await getAuthCookie()
      })
    } catch (ex: any) {
      expect(ex.status).eq(401)
    }
    setCurrentUser({ id: 1, office_id: null })
  })

  
  it('should create a new office', async () => {
    const response = await $fetch<any>('/api/offices', {
      method: 'POST',
      body: { name: 'Escritório Teste' }, headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('id')
    createdOfficeId = Number(response.id)
  })

  it('should list offices', async () => {
    const response = await $fetch<any>('/api/offices')

    expect(response).toHaveProperty('success', true)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.meta).toBeDefined()
  })

  it('should create a user for the office', async () => {
    if (!createdOfficeId) throw new Error('Office was not created')

    const newUser = {
      name: 'Office User',
      username: `office_user_${Date.now()}`,
      email: `office_user_${Date.now()}@example.com`,
      password: 'password123',
    }

    const response = await $fetch<any>(`/api/offices/${createdOfficeId}/users`, {
      method: 'POST',
      body: newUser,
      headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('id')
    expect(response).toHaveProperty('office_id', createdOfficeId)
    expect(response).toHaveProperty('email', newUser.email)
  })

  it('should retrieve a single office', async () => {
    if (!createdOfficeId) throw new Error('Office was not created')

    const response = await $fetch<any>(`/api/offices/${createdOfficeId}`, { headers: await getAuthCookie() })

    expect(response).toHaveProperty('success', true)
    expect(response.data.id).toBe(createdOfficeId)
  })

  it('should update an office', async () => {
    if (!createdOfficeId) throw new Error('Office was not created')

    const response = await $fetch<any>(`/api/offices/${createdOfficeId}`, {
      method: 'PUT',
      body: { name: 'Escritório Teste Atualizado' },
    })

    expect(response).toHaveProperty('success', true)
  })

  it('should not delete an office with linked users', async () => {
    if (!createdOfficeId) throw new Error('Office was not created')

    const hashedPassword = await bcrypt.hash('password123', 10)

    await sql`INSERT INTO users (office_id, name, username, email, password) VALUES (${createdOfficeId}, 'User Attached', ${`attached_${Date.now()}`}, ${`attached_${Date.now()}@example.com`}, ${hashedPassword})`

    try {
      await $fetch(`/api/offices/${createdOfficeId}`, {
        method: 'DELETE'
      })
      throw new Error('Expected delete to fail')
    } catch (error: any) {
      expect(error.response?.status).toBe(400)
    }
  })

  it('should delete an office without users', async () => {
    await sql`DELETE FROM users WHERE office_id = ${createdOfficeId}`
    if (!createdOfficeId) throw new Error('Office was not created')

    const response = await $fetch<any>(`/api/offices/${createdOfficeId}`, {
      method: 'DELETE',
      headers: await getAuthCookie()
    })

    expect(response).toHaveProperty('success', true)

  })
})
