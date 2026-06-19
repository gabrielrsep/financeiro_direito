import { neonClient as sql } from '~~/server/database/connection'
import bcrypt from 'bcrypt'
import { validCredentials } from '~~/server/util/validation/http'
import { findFormDataValue, getFormDataValue, uploadFile } from '~~/server/util/upload'
import { devLogger } from '~~/server/util/logger'

export default defineEventHandler(async (event) => {

  const officeId = Number(getRouterParam(event, 'id'))
  if (!officeId) {
    throw createError({ statusCode: 400, message: 'ID do escritório inválido.' })
  }
  const { user } = await getUserSession(event)
  if(user!.office_id) {
    throw createError({ statusCode: 403, message: 'Você precisa ser administrador para adicionar usuários a outros escritórios.' })
  }

  const officeResult = await sql`SELECT id FROM offices WHERE id = ${officeId}`

  if (officeResult.length === 0) {
    throw createError({ statusCode: 404, message: 'Escritório não encontrado.' })
  }

  let name: string | undefined
  let username: string | undefined
  let email: string | undefined
  let password: string | undefined
  let avatar: any = null
  let body: any = null

  const contentType = (getRequestHeader(event, 'content-type') || '').toLowerCase()
  if (contentType.includes('multipart/form-data')) {
    body = await readMultipartFormData(event)
    name = getFormDataValue(body, 'name')
    username = getFormDataValue(body, 'username')
    email = getFormDataValue(body, 'email')
    password = getFormDataValue(body, 'password')
    avatar = findFormDataValue(body, 'avatar')
  } else {
    body = await readBody<{ name?: string; username?: string; email?: string; password?: string }>(event)
    name = body.name
    username = body.username
    email = body.email
    password = body.password
  }

  if (!name || !username || !email || !password) {
    throw createError({ statusCode: 400, message: 'Todos os campos (nome, usuário, email e senha) são obrigatórios.' })
  }

  validCredentials({ username, email, password })

  const existingUser = await sql`
    SELECT id FROM users
    WHERE (lower(username) = lower(${username})) OR (lower(email) = lower(${email}) AND office_id = ${user!.office_id})`

  if (existingUser.length > 0) {
    throw createError({ statusCode: 409, message: 'Usuário ou email já cadastrado.' })
  }

  const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS || 12))

  try {
    const result = await sql`INSERT INTO users (office_id, name, username, email, password) VALUES (${officeId}, ${name}, ${username}, ${email}, ${hashedPassword}) RETURNING id`

    const userId = Number(result[0]!.id)
    let avatarUrl: string | null = null

    if (avatar && body) {
      const blob = await uploadFile(body, 'avatar', 'avatar', {
        mimeType: ['image/jpeg', 'image/png', 'image/jpg'],
        fileSize: 1024 * 1024 * 2,
      })
      avatarUrl = blob.url as string
      await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${userId}`
    }

    return {
      id: userId,
      office_id: officeId,
      name,
      username,
      email,
      avatar_url: avatarUrl,
    }
  } catch (error: any) {
    devLogger.error(error)
    throw createError({ statusCode: 500, message: 'Erro ao criar usuário.' })
  }
})
