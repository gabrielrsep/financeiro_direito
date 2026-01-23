import { validCredentials } from "~~/server/util/validation/http";
import { db } from "~~/server/database/connection";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  const session = getCookie(event, "auth_session");
  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Não autorizado.",
    });
  }

  const { office_id } = JSON.parse(session);
  const body = await readBody(event);
  const { name, username, email, password } = body;

  if (!name || !username || !email || !password) {
    throw createError({
      statusCode: 400,
      message: "Todos os campos (nome, usuário, email e senha) são obrigatórios.",
    });
  }

  validCredentials({username, email, password})

  // Check if username already exists
  const existingUser = await db.execute({
    sql: "SELECT id FROM users WHERE username = ? OR email = ?",
    args: [username, email],
  });

  if (existingUser.rows.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Usuário ou email já cadastrado.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS || 12));

  try {
    const result = await db.execute({
      sql: "INSERT INTO users (office_id, name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      args: [office_id, name, username, email, hashedPassword],
    });

    return {
      id: Number(result.lastInsertRowid),
      name,
      username,
      email,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Erro ao criar usuário.",
    });
  }
});
