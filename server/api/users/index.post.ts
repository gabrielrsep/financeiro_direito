import { validCredentials } from "~~/server/util/validation/http";
import bcrypt from "bcrypt";
import type { PutBlobResult } from "@vercel/blob";
import { findFormDataValue, getFormDataValue, uploadFile } from "~~/server/util/upload";
import { neonClient as sql } from '~~/server/database/connection'

export default defineEventHandler(async (event) => {

  const contentType = getHeader(event, 'Content-Type')

  if(!contentType?.startsWith('multipart/form-data')) {
    throw createError('Content-Type must be multipart/form-data')
  }

  const { user } = await getUserSession(event)!;
  const body = await readMultipartFormData(event);

  const name = getFormDataValue(body, "name");
  const username = getFormDataValue(body, "username");
  const email = getFormDataValue(body, "email");
  const password = getFormDataValue(body, "password");
  const avatar = findFormDataValue(body, "avatar");

  if (!name || !username || !email || !password) {
    throw createError({
      statusCode: 400,
      message: "Todos os campos (nome, usuário, email e senha) são obrigatórios.",
    });
  }

  validCredentials({username, email, password})

  // Check if username already exists or email already exists for the given office id
  const existingUser = await sql.query(`
      SELECT id FROM users
      WHERE (lower(username)) = lower($1) OR (lower(email) = lower($2) AND office_id = $3)
    `,
    [username, email, user!.office_id])
  if (existingUser.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Usuário ou email já cadastrado.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS || 12));

  try {
    let blob: {url: string} | PutBlobResult | null = null;
    if (avatar) {
      blob = await uploadFile(body!, "avatar", 'avatar', {
        mimeType: ["image/jpeg", "image/png", "image/jpg"],
        fileSize: 1024 * 1024 * 2
      });
    }

    const result = await sql.query(
      `INSERT INTO users (office_id, name, username, email, password, avatar_url) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user!.office_id, name, username, email, hashedPassword, blob?.url]
    );
    return {
      id: result[0]!.id,
      name,
      username,
      email,
      avatar_url: blob?.url,
      office_id: user!.office_id
    };
  } catch (error: any) {
    throw createError({
      status: 500,
      message: error.message,
    });
  }
});
