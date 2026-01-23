
import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { db } from '../../server/database/connection'
import bcrypt from 'bcrypt'

describe('Users API', async () => {
  await setup({
    server: true
  })

  let createdUserId: number | null = null
  let authCookie: string | undefined

  // User to act as admin/logged in user
  const adminUser = {
    username: `admin_test_${Date.now()}`,
    email: `admin_test_${Date.now()}@example.com`,
    password: 'password123'
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
    name: 'Updated Test User',
    username: 'test_user_updated',
    email: 'updatedtestuser@example.com',
    password: 'newpassword123'
  }

  beforeAll(async () => {
    try {
      // 1. Ensure Office exists
      let officeId: number
      const officeRes = await db.execute("SELECT id FROM offices LIMIT 1")
      if (officeRes.rows.length > 0) {
        officeId = Number(officeRes.rows[0]!.id)
      } else {
        const newOffice = await db.execute({
          sql: "INSERT INTO offices (name) VALUES (?)",
          args: ["Test Office"]
        })
        officeId = Number(newOffice.lastInsertRowid)
      }

      // 2. Create Admin User
      const hashedPassword = await bcrypt.hash(adminUser.password, 10)
      await db.execute({
        sql: "INSERT INTO users (office_id, name, username, email, password) VALUES (?, ?, ?, ?, ?)",
        args: [officeId, "Test Admin", adminUser.username, adminUser.email, hashedPassword]
      })

      // 3. Login
      const response = await $fetch<any>('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: adminUser.username,
          password: adminUser.password
        },
        onResponse({ response }) {
          const setCookie = response.headers.get('set-cookie')
          if (setCookie) {
            authCookie = setCookie.split(';')[0]
          }
        }
      })
      
      if (!response.user) {
         throw new Error('Login failed')
      }

    } catch (error) {
      console.error('Setup failed:', error)
      throw error 
    }
  })

  // --- Validation Tests (New Logic) ---

  it('should return 400 if required fields are missing', async () => {
    try {
      await $fetch<any>('/api/users', {
        method: 'POST',
        body: { name: 'Missing Fields' },
        headers: { Cookie: authCookie || '' }
      })
      throw new Error('Should have returned 400')
    } catch (err: any) {
      expect(err.response?.status).toBe(400)
      expect(err.response?._data?.message).toContain('obrigatórios')
    }
  })

  it('should return 400 if username is too short (< 3 chars)', async () => {
    try {
      await $fetch<any>('/api/users', {
        method: 'POST',
        body: { ...testUser, username: 'ab' },
        headers: { Cookie: authCookie || '' }
      })
      throw new Error('Should have returned 400')
    } catch (err: any) {
      expect(err.response?.status).toBe(400)
      expect(err.response?._data?.message).toContain('O nome de usuário deve começar com uma letra')
    }
  })

  it('should return 400 if username contains invalid characters', async () => {
     // Valid: alphanumeric + underscore. Invalid: @, space, -, etc.
    try {
      await $fetch<any>('/api/users', {
        method: 'POST',
        body: { ...testUser, username: 'user@name' },
        headers: { Cookie: authCookie || '' }
      })
      throw new Error('Should have returned 400')
    } catch (err: any) {
      expect(err.response?.status).toBe(400)
      expect(err.response?._data?.message).toContain('O nome de usuário deve começar com uma letra')
    }
  })

  it('should return 400 if username has all repeated characters', async () => {
    // Current logic blocks if all chars are the same.
    try {
      await $fetch<any>('/api/users', {
        method: 'POST',
        body: { ...testUser, username: 'aaaaa' },
        headers: { Cookie: authCookie || '' }
      })
      throw new Error('Should have returned 400')
    } catch (err: any) {
      expect(err.response?.status).toBe(400)
      expect(err.response?._data?.message).toContain('O nome de usuário deve começar com uma letra')
    }
  })

  // --- CRUD Tests ---

  it('should create a new user successfully', async () => {
    const response = await $fetch<any>('/api/users', {
      method: 'POST',
      body: testUser,
      headers: { Cookie: authCookie || '' }
    })

    expect(response).toHaveProperty('id')
    expect(response.username).toBe(testUser.username)
    createdUserId = response.id
  })

  it('should prevent creating a user with duplicate username', async () => {
    try {
      await $fetch<any>('/api/users', {
        method: 'POST',
        body: testUser, // Same username
        headers: { Cookie: authCookie || '' }
      })
      throw new Error('Should have returned 409')
    } catch (err: any) {
      expect(err.response?.status).toBe(409)
      expect(err.response?._data?.message).toContain('já cadastrado')
    }
  })

  it('should list users', async () => {
    const response = await $fetch<any[]>('/api/users', {
        headers: { Cookie: authCookie || '' }
    })
    expect(Array.isArray(response)).toBe(true)
    expect(response.length).toBeGreaterThan(0)
  })

  it('should update the user', async () => {
    if (!createdUserId) return

    const response = await $fetch<any>(`/api/users/${createdUserId}`, {
      method: 'PUT',
      body: updatedUser,
      headers: { Cookie: authCookie || '' }
    })
    
    expect(response).toHaveProperty('success', true)
    
    // Check if updated in DB (optional, but good)
    // Or fetch list to verify? user list endpoint might return filtered data.
  })

  it('should delete the user', async () => {
    if (!createdUserId) return

    const response = await $fetch<any>(`/api/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Cookie: authCookie || '' }
    })
    expect(response).toHaveProperty('success', true)
  })

})
