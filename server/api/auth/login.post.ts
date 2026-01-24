import { devLogger } from "~~/server/util/logger";
import { db } from "../../database/connection";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { identifier, password } = body;
  const ipAddress = getRequestIP(event) || '0.0.0.0';

  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      message: "Identificador e senha são obrigatórios.",
    });
  }

  // 1. Check Rate Limiting
  const loginAttempts = await db.execute({
    sql: "SELECT * FROM login_attempts WHERE identifier = ? AND ip_address = ?",
    args: [identifier, ipAddress],
  });

  const now = new Date();
  if (loginAttempts.rows.length > 0) {
    const attempt = loginAttempts.rows[0];
    const lastAttemptAt = new Date(attempt.last_attempt_at as string);
    const diffMinutes = (now.getTime() - lastAttemptAt.getTime()) / (1000 * 60);

    if (attempt.attempts as number >= 5 && diffMinutes < 15) {
      throw createError({
        statusCode: 429,
        message: "Muitas tentativas. Tente novamente em 15 minutos.",
      });
    }

    // Reset attempts if it's been more than 15 minutes
    if (diffMinutes >= 15) {
      await db.execute({
        sql: "UPDATE login_attempts SET attempts = 0, last_attempt_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [attempt.id],
      });
    }
  }

  // 2. Find User
  const users = await db.execute({
    sql: "SELECT u.*, o.name as office_name FROM users u JOIN offices o ON u.office_id = o.id WHERE u.username = ? OR u.email = ?",
    args: [identifier, identifier],
  });

  if (users.rows.length === 0) {
    await recordLoginAttempt(identifier, ipAddress);
    throw createError({
      statusCode: 401,
      message: "Credenciais inválidas.",
    });
  }

  const user = users.rows[0];

  // 3. Verify Password
  const isPasswordValid = await bcrypt.compare(password, user.password as string);

  if (!isPasswordValid) {
    await recordLoginAttempt(identifier, ipAddress);
    throw createError({
      statusCode: 401,
      message: "Credenciais inválidas.",
    });
  }

  // 4. Success - Clear attempts
  await db.execute({
    sql: "DELETE FROM login_attempts WHERE identifier = ? AND ip_address = ?",
    args: [identifier, ipAddress],
  });

  // 5. Set Session Cookie (Simplified for now - using JSON for simple system)
  // In a real production app, this should be signed or a JWT
  const sessionData = {
    id: user.id,
    name: user.name,
    username: user.username,
    office_id: user.office_id,
    office_name: user.office_name,
    avatar_url: user.avatar_url,
  };

  setCookie(event, "auth_session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return {
    user: sessionData,
  };
});

async function recordLoginAttempt(identifier: string, ipAddress: string) {
  const result = await db.execute({
    sql: "INSERT INTO login_attempts (identifier, ip_address, attempts, last_attempt_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(identifier, ip_address) DO UPDATE SET attempts = attempts + 1, last_attempt_at = CURRENT_TIMESTAMP",
    args: [identifier, ipAddress],
  });
  return result;
}
