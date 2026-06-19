import { describe, it, expect, beforeAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { nanoid } from 'nanoid'
import { hash } from 'bcrypt'
import { neonClient as sql } from '../../server/database/connection'

describe('Password Reset API', async () => {
  await setup({ server: true })

  const setupData = {
    officeName: 'Reset Test Office',
    adminName: 'Reset Test User',
    username: 'reset_test_user',
    email: 'reset_test_user@example.com',
    password: 'initialPassword123'
  }

  let userId: number



  const findUserId = async () => {
    try {
      const result = await sql`SELECT id, email FROM users WHERE LOWER(email) = LOWER(${setupData.email}) LIMIT 1`

      if (result.length === 0) {
         const insertResult = await sql.query('INSERT INTO users (name, username, email, password, office_id) VALUES ($1, $2, $3, $4, $5) RETURNING id', [
          setupData.adminName,
          setupData.username,
          setupData.email,
          await hash(setupData.password, 10),
          1 // Assuming a default office ID
        ])
        return insertResult[0]!.id as number
      }

      return result[0]?.id as number
    } catch (error: any) {
      // If the database schema has not been initialized yet, the users table may not exist.
      if (error.message?.includes('no such table')) {
        return null
      }
      throw error
    }
  }

  const ensureSetupUser = async () => {

    const createdUserId = await findUserId()
    if (!createdUserId) {
      throw new Error('Failed to create setup user for password reset tests')
    }
    return createdUserId
  }

  const clearRecoveryAttempts = async () => {
    await sql`DELETE FROM password_recovery_attempts WHERE LOWER(email) = LOWER(${setupData.email})`
  }

  const createRecoveryToken = async () => {
    await clearRecoveryAttempts()

    const token = nanoid()
    await sql`INSERT INTO password_recovery_tokens (user_id, token, expires_at) VALUES (${userId}, ${token}, CURRENT_TIMESTAMP + INTERVAL '1 hours')`
    return token
  }

  beforeAll(async () => {
    userId = await ensureSetupUser()
  })

  it('should reset password successfully when token is valid', async () => {
    const recoveryToken = await createRecoveryToken()
    const newPassword = 'NewPassword123!'

    const response = await $fetch(`/api/auth/reset-password?token=${recoveryToken}`, {
      method: 'POST',
      body: {
        password: newPassword,
        password_confirmation: newPassword,
      },
    })

    expect(response).toEqual({
      success: true,
      message: expect.any(String),
    })

    const loginResponse = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: setupData.email,
        password: newPassword,
      },
    })

    expect(loginResponse).toBe(true)
  })

  it('should delete the recovery token after successful reset', async () => {
    const recoveryToken = await createRecoveryToken()
    const newPassword = 'AnotherPassword123!'

    await $fetch(`/api/auth/reset-password?token=${recoveryToken}`, {
      method: 'POST',
      body: {
        password: newPassword,
        password_confirmation: newPassword,
      },
    })

    try {
      await $fetch('/api/auth/reset-password', {
        method: 'POST',
        query: { token: recoveryToken },
        body: {
          password: 'SomeOtherPassword123!',
          password_confirmation: 'SomeOtherPassword123!',
        },
      })
      expect.fail('Token reuse should not be allowed')
    } catch (error: any) {
      expect(error.status).toBe(401)
      expect(error.data?.message).toContain('expirado ou inválido')
    }
  })

  it('should reject reset when token is invalid', async () => {
    try {
      await $fetch('/api/auth/reset-password?token=invalid-token-123', {
        method: 'POST',
        body: {
          password: 'ValidPassword123',
          password_confirmation: 'ValidPassword123',
        },
      })
      expect.fail('Expected invalid token to fail')
    } catch (error: any) {
      expect(error.status).toBe(401)
      expect(error.data?.message).toContain('expirado ou inválido')
    }
  })

  it('should reject reset when passwords do not match', async () => {
    const recoveryToken = await createRecoveryToken()

    try {
      await $fetch(`/api/auth/reset-password?token=${recoveryToken}`, {
        method: 'POST',
        body: {
          password: 'ValidPassword123',
          password_confirmation: 'DifferentPassword123',
        },
      })
      expect.fail('Expected password mismatch to fail')
    } catch (error: any) {
      expect(error.status).toBe(400)
      expect(error.data?.message).toContain('não conferem')
    }
  })

  it('should reject reset when password is too short', async () => {
    const recoveryToken = await createRecoveryToken()

    try {
      await $fetch(`/api/auth/reset-password?token=${recoveryToken}`, {
        method: 'POST',
        body: {
          password: 'short',
          password_confirmation: 'short',
        },
      })
      expect.fail('Expected short password to fail')
    } catch (error: any) {
      expect(error.status).toBe(400)
      expect(error.data?.message).toContain('no mínimo 8 caracteres')
    }
  })
})
