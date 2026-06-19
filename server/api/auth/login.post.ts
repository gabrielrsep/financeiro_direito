import { neonClient } from "../../database/connection";
import bcrypt from "bcrypt";


type LoginRequestBody = {
  identifier: string; // Can be username or email
  password: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as LoginRequestBody;
  const { identifier, password } = body;
  const ipAddress = getRequestIP(event, { xForwardedFor: true }) || '0.0.0.0';
  
  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      message: "Identificador e senha são obrigatórios.",
    });
  }

  const lowerIdentifier = identifier.toLowerCase();

  // 1. Check Rate Limiting

  const loginAttempts = await neonClient`SELECT * FROM login_attempts WHERE lower(identifier) = ${lowerIdentifier} AND ip_address = ${ipAddress}`;

  const now = new Date();
  if (loginAttempts.length > 0) {
    const attempt = loginAttempts[0];
    const lastAttemptAt = attempt?.last_attempt_at as Date
    const diffMinutes = (now.getTime() - lastAttemptAt.getTime()) / (1000 * 60);

    if (attempt?.attempts as number >= 5 && diffMinutes < 15) {
      throw createError({
        statusCode: 429,
        message: "Muitas tentativas. Tente novamente em 15 minutos.",
      });
    }

    // Reset attempts if it's been more than 15 minutes
    if (diffMinutes >= 15) {
      await neonClient`UPDATE login_attempts SET attempts = 0, last_attempt_at = CURRENT_TIMESTAMP WHERE id = ${attempt?.id as number}`;
    }
  }

  // 2. Find User
  const users = await neonClient`SELECT * FROM users WHERE lower(username) = ${lowerIdentifier} OR lower(email) = ${lowerIdentifier}`;

  if (users.length === 0) {
    await recordLoginAttempt(identifier, ipAddress);
    throw createError({
      statusCode: 401,
      message: "Credenciais inválidas.",
    });
  }

  const user = users[0]!

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
  await neonClient`DELETE FROM login_attempts WHERE identifier = ${identifier} AND ip_address = ${ipAddress}`;

  const sessionData = {
    id: user.id,
    name: user.name,
    username: user.username,
    office_id: user.office_id,
    office_name: user.office_name,
    avatar_url: user.avatar_url,
  };

  await setUserSession(event, {
    user: sessionData
  })

  return true
});

async function recordLoginAttempt(identifier: string, ipAddress: string) {
  const result = await neonClient`
    INSERT INTO login_attempts
      (identifier, ip_address, attempts, last_attempt_at)
      VALUES (${identifier}, ${ipAddress}, 1, CURRENT_TIMESTAMP) ON
      CONFLICT(identifier, ip_address)
      DO UPDATE SET attempts = login_attempts.attempts + 1, last_attempt_at = CURRENT_TIMESTAMP
    `;
  return result;
}
