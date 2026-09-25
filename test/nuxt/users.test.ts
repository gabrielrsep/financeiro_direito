

import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils'
import { neonClient as sql } from '../../server/database/connection'
import bcrypt from 'bcrypt'
import NodeFormData from 'form-data'

import { resolve } from 'node:path'
import { getAuthCookie, setCurrentUser } from '../util'


describe('Users API', async () => {
  await setup({
    server: true,
    nuxtConfig: {
      alias: {
        '@vercel/blob': resolve(process.cwd(), 'test/mocks/vercel-blob.ts')
      }
    }
  })

  let createdUserId: number | null = null

  // User to act as admin/logged in user
  const adminUser = {
    username: `admin_test_${Date.now()}`,
    email: `admin_test_${Date.now()}@example.com`,
    password: 'password123',

  }

  // User to be created/tested
  const testUser = {
    name: 'Test User',
    username: 'test_user_123',
    email: 'testuser123@example.com',
    password: 'password123'
  }

  // Valid updated user
  const updatedUser = {
    name: 'Updated Test Usersdfsdf',
    username: `test_user_${Date.now()}`,
    email: `test_user_${Date.now()}@email.com`,
    password: 'newpassword123'
  }

  beforeAll(async () => {
    try {
      // 1. Ensure Office exists
      let officeId: number = 0
      const officeRes = await sql`SELECT id FROM offices LIMIT 1`
      if (officeRes.length > 0) {
        officeId = Number(officeRes[0]!.id)
      } else {
        const newOffice = await sql`INSERT INTO offices (name) VALUES ('Test Office') RETURNING id`
        officeId = Number(newOffice[0]!.id)
      }

      // 2. Create Admin User
      const hashedPassword = await bcrypt.hash(adminUser.password, 10)
      await sql`INSERT INTO users (office_id, name, username, email, password) VALUES
        (${officeId}, 'Test Admin', ${adminUser.username}, ${adminUser.email}, ${hashedPassword})`

    } catch (error) {
      console.error('Setup failed:', error)
      throw error 
    }

    setCurrentUser(adminUser)
  })

  // --- Validation Tests (New Logic) ---

  it('should return 400 if required fields are missing', async () => {
    const formData = new NodeFormData()
    formData.append('name', 'Missing Fields')
    // Missing other fields

    const response = await fetch('/api/users', {
      method: 'POST',
        body: formData as any,
        headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
      })
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.message).toContain('obrigatórios')
  })

  it('should return 400 if username is too short (< 3 chars)', async () => {
    const formData = new NodeFormData()
    formData.append('name', testUser.name)
    formData.append('username', 'ab')
    formData.append('email', testUser.email)
    formData.append('password', testUser.password)

    const response = await fetch('/api/users', {
      method: 'POST',
      body: formData.getBuffer() as any,
      headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
    })
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.message).toContain('O nome de usuário deve começar com uma letra')
  })

  it('should return 400 if username contains invalid characters', async () => {
    // Valid: alphanumeric + underscore. Invalid: @, space, -, etc.
    const formData = new NodeFormData()
    formData.append('name', testUser.name)
    formData.append('username', 'user@name')
    formData.append('email', testUser.email)
    formData.append('password', testUser.password)

    const response = await fetch('/api/users', {
      method: 'POST',
      body: formData.getBuffer() as any,
      headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
    })
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.message).toContain('O nome de usuário deve começar com uma letra')
  })

  it('should return 400 if username has all repeated characters', async () => {
    // Current logic blocks if all chars are the same.
    const formData = new NodeFormData()
    formData.append('name', testUser.name)
    formData.append('username', 'aaaaa')
    formData.append('email', testUser.email)
    formData.append('password', testUser.password)

    const response = await fetch('/api/users', {
        method: 'POST',
        body: formData.getBuffer() as any,
        headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
      })
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.message).toContain('O nome de usuário deve começar com uma letra')
  })

  // --- CRUD Tests ---

  it('should create a new user successfully without avatar', async () => {
    const testUser = {
      name: 'Test User',
      username: 'testuser_' + Date.now(),
      email: 'testuser' + Date.now() + '@example.com',
      password: 'testpassword'
    }
    const formData = new NodeFormData()
    formData.append('name', testUser.name)
    formData.append('username', testUser.username)
    formData.append('email', testUser.email)
    formData.append('password', testUser.password)
    
    const response = await fetch('/api/users', {
      method: 'POST',
      body: formData.getBuffer() as any,
      headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
    })

    const data = await response.json()

    
    expect(data.id).toBeDefined()
    expect(data.username).toBe(testUser.username)
    expect(data.avatar_url).toBeNull()
    const [createdUser] = await sql`SELECT avatar_url FROM users WHERE id = ${data.id}`
    expect(createdUser!.avatar_url).toBeNull()
    createdUserId = Number(data.id)
  })

  it('should prevent creating a user with duplicate username', async () => {
    // Create the first user
    const firstUser = {
      name: 'First User',
      username: 'duplicate_test_' + Date.now(),
      email: 'duplicate_test' + Date.now() + '@example.com',
      password: 'password123'
    }
    
    let formData = new NodeFormData()
    formData.append('name', firstUser.name)
    formData.append('username', firstUser.username)
    formData.append('email', firstUser.email)
    formData.append('password', firstUser.password)

    const firstResponse = await fetch('/api/users', {
      method: 'POST',
      body: formData.getBuffer() as any,
      headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
    })
    
    expect(firstResponse.status).toBe(200)

    // Try to create a second user with the same username
    formData = new NodeFormData()
    formData.append('name', 'Another User')
    formData.append('username', firstUser.username) // Same username
    formData.append('email', 'another' + Date.now() + '@example.com')
    formData.append('password', 'password123')

    const response = await fetch('/api/users', {
      method: 'POST',
      body: formData.getBuffer() as any,
      headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
    })
    const data = await response.json()
    expect(response.status).toBe(409)
    expect(data.message).toContain('já cadastrado')
  })

  it('should list users', async () => {
    setCurrentUser({ office_id: 1 })
    const response = await $fetch<any[]>('/api/users', {
        headers: await getAuthCookie()
    })
    expect(Array.isArray(response)).toBe(true)
    expect(response.length).toBeGreaterThan(0)
  })

  it('should update the user without changing existing avatar data', async () => {
    if (!createdUserId) return

    setCurrentUser({ office_id: null })
    const legacyAvatarUrl = 'https://legacy.example.com/avatar.png'
    await sql`UPDATE users SET avatar_url = ${legacyAvatarUrl} WHERE id = ${createdUserId}`

    const formData = new NodeFormData()
    formData.append('name', updatedUser.name)
    formData.append('username', updatedUser.username)
    formData.append('email', updatedUser.email)
    formData.append('password', updatedUser.password)


    const response = await fetch(`/api/users/${createdUserId}`, {
      method: 'PUT',
      body: formData.getBuffer() as any,
      headers: { ...formData.getHeaders(), ...(await getAuthCookie()) }
    })
    
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)
    const [updatedUserRecord] = await sql`SELECT avatar_url FROM users WHERE id = ${createdUserId}`
    expect(updatedUserRecord!.avatar_url).toBe(legacyAvatarUrl)
  })

  it('should delete the user', async () => {
    if (!createdUserId) return

    const response = await fetch(`/api/users/${createdUserId}`, {
      method: 'DELETE',
      headers: await getAuthCookie()
    })
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)
  })

})

