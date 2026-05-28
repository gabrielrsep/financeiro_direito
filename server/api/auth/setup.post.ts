import { db } from "../../database/connection";
import bcrypt from "bcrypt";
import { validCredentials } from "~~/server/util/validation/http";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { officeName, adminName, username, email, password } = body;

  // 1. Validation
  if (!officeName || !adminName || !username || !email || !password) {
    throw createError({
      statusCode: 400,
      message: "Todos os campos são obrigatórios.",
    });
  }

  validCredentials({username, email, password})

  // 2. Check if users already exist
  const existingUsers = await db.execute("SELECT COUNT(*) as count FROM users");
  if (Number(existingUsers.rows[0]?.count || 0) > 0) {
    throw createError({
      statusCode: 403,
      message: "O sistema já foi configurado.",
    });
  }

  try {
    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS || 12));

    const trx = await db.transaction();

    const officeResult = await trx.execute({
      sql: "INSERT INTO offices (name) VALUES (?)",
      args: [officeName]
    });
    
    const officeId = Number(officeResult.lastInsertRowid);

    const userResult = await trx.execute({
      sql: "INSERT INTO users (office_id, name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      args: [officeId, adminName, username, email, hashedPassword]
    });

    await trx.commit();

    const userId = Number(userResult.lastInsertRowid);

    // 5. Success - Set Session Cookie
    const sessionData = {
      id: userId,
      name: adminName,
      username: username,
      office_id: officeId,
      office_name: officeName,
    };

    setCookie(event, "auth_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
  } catch (error: any) {
    console.error("Setup error:", error);
    throw createError({
      statusCode: 500,
      message: "Erro interno ao configurar o sistema: " + error.message,
    });
  }
});
