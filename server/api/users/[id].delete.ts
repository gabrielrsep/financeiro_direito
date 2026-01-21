import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
  const session = getCookie(event, "auth_session");
  if (!session) {
    throw createError({
      statusCode: 401,
    });
  }

  const { office_id, id: currentUserId } = JSON.parse(session);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do usuário é obrigatório.",
    });
  }

  if (Number(id) === Number(currentUserId)) {
    throw createError({
      statusCode: 400,
      message: "Você não pode excluir seu próprio usuário.",
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
      message: "Usuário não encontrado.",
    });
  }

  // Prevent deleting the last user in the office? 
  // Let's check how many users are left
  const usersCount = await db.execute({
    sql: "SELECT COUNT(*) as count FROM users WHERE office_id = ?",
    args: [office_id],
  });

  if ((usersCount.rows[0].count as number) <= 1) {
    throw createError({
      statusCode: 400,
      message: "Não é possível excluir o único usuário do escritório.",
    });
  }

  try {
    await db.execute({
      sql: "DELETE FROM users WHERE id = ?",
      args: [id],
    });

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Erro ao excluir usuário.",
    });
  }
});
