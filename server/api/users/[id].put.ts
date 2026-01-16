import { db } from "../../database/connection";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  const session = getCookie(event, "auth_session");
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Não autorizado.",
    });
  }

  const { office_id } = JSON.parse(session);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID do usuário é obrigatório.",
    });
  }

  const body = await readBody(event);
  const { name, username, email, password } = body;

  if (!name || !username || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nome, usuário e email são obrigatórios.",
    });
  }

  // Check if user exists and belongs to the same office
  const user = await db.execute({
    sql: "SELECT id FROM users WHERE id = ? AND office_id = ?",
    args: [id, office_id],
  });

  if (user.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Usuário não encontrado.",
    });
  }

  // Check if username/email already taken by another user
  const existingUser = await db.execute({
    sql: "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
    args: [username, email, id],
  });

  if (existingUser.rows.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Usuário ou email já cadastrado por outra pessoa.",
    });
  }

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute({
        sql: "UPDATE users SET name = ?, username = ?, email = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [name, username, email, hashedPassword, id],
      });
    } else {
      await db.execute({
        sql: "UPDATE users SET name = ?, username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [name, username, email, id],
      });
    }

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erro ao atualizar usuário.",
    });
  }
});
