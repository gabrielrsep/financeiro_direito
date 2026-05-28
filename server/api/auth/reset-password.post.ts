import { db } from "~~/server/database/connection";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const body = await readBody(event);

  const { token } = query;
  const { password, password_confirmation: passwordConfirmation } = body;

  // ===== Validate token is provided =====
  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token de recuperação não fornecido",
    });
  }

  // ===== Validate passwords are provided =====
  if (!password || !passwordConfirmation) {
    throw createError({
      statusCode: 400,
      statusMessage: "Senha e confirmação de senha são obrigatórias",
    });
  }

  // ===== Validate passwords match =====
  if (password !== passwordConfirmation) {
    throw createError({
      statusCode: 400,
      statusMessage: "As senhas não conferem",
    });
  }

  // ===== Validate password length (minimum 8 characters) =====
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "A senha deve ter no mínimo 8 caracteres",
    });
  }

  // ===== Validate password is not empty after trimming =====
  if (!password.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "A senha não pode ser vazia",
    });
  }

  // ===== Find and validate token =====
  const tokenResult = await db.execute({
    sql: `SELECT id, user_id FROM password_recovery_tokens 
          WHERE token = ? AND datetime(expires_at) > datetime('now')
          LIMIT 1`,
    args: [token as string],
  });

  if (tokenResult.rows.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: "Token de recuperação expirado ou inválido",
    });
  }

  const tokenRecord = tokenResult.rows[0];
  const userId = tokenRecord.user_id;

  // ===== Verify user exists =====
  const userResult = await db.execute({
    sql: "SELECT id FROM users WHERE id = ? LIMIT 1",
    args: [userId],
  });

  if (userResult.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Usuário não encontrado",
    });
  }

  // ===== Hash new password =====
  const hashedPassword = await bcrypt.hash(password, 10);

  // ===== Update user password =====
  await db.execute({
    sql: `UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [hashedPassword, userId],
  });

  // ===== Delete/Invalidate the token =====
  await db.execute({
    sql: "DELETE FROM password_recovery_tokens WHERE id = ?",
    args: [tokenRecord.id],
  });

  return {
    success: true,
    message: "Senha resetada com sucesso. Redirecionando para login...",
  };
});
