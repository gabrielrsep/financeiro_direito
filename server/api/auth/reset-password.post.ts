import bcrypt from "bcrypt";
import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const body = await readBody(event);

  const { token } = query;
  const { password, password_confirmation: passwordConfirmation } = body;

  // ===== Validate token is provided =====
  if (!token) {
    throw createError({
      statusCode: 400,
      message: "Token de recuperação não fornecido",
    });
  }

  // ===== Validate passwords are provided =====
  if (!password || !passwordConfirmation) {
    throw createError({
      statusCode: 400,
      message: "Senha e confirmação de senha são obrigatórias",
    });
  }

  // ===== Validate passwords match =====
  if (password !== passwordConfirmation) {
    throw createError({
      statusCode: 400,
      message: "As senhas não conferem",
    });
  }

  // ===== Validate password length (minimum 8 characters) =====
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: "A senha deve ter no mínimo 8 caracteres",
    });
  }

  // ===== Validate password is not empty after trimming =====
  if (!password.trim()) {
    throw createError({
      statusCode: 400,
      message: "A senha não pode ser vazia",
    });
  }



  // ===== Find and validate token =====

  const tokenResult = await sql`SELECT id, user_id FROM password_recovery_tokens 
          WHERE token = ${token} AND expires_at > CURRENT_TIMESTAMP
          LIMIT 1`;

  if (tokenResult.length === 0) {
    throw createError({
      statusCode: 401,
      message: "Token de recuperação expirado ou inválido",
    });
  }

  const tokenRecord = tokenResult[0];
  const userId = tokenRecord!.user_id;

  // ===== Verify user exists =====
  const userResult = await sql`SELECT id FROM users WHERE id = ${userId} LIMIT 1`;


  if (userResult.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Usuário não encontrado",
    });
  }

  // ===== Hash new password =====
  const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS) || 12);

  // ===== Update user password =====

  await sql.transaction([
    sql`UPDATE users SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`,
    sql`DELETE FROM password_recovery_tokens WHERE id = ${tokenRecord!.id}`,
  ])

  return {
    success: true,
    message: "Senha resetada com sucesso. Redirecionando para login...",
  };
});
