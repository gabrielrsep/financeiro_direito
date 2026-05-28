import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID do escritório inválido.",
    });
  }

  const officeResult = await db.execute({
    sql: "SELECT id FROM offices WHERE id = ?",
    args: [id],
  });

  if (officeResult.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Escritório não encontrado.",
    });
  }

  const usersResult = await db.execute({
    sql: "SELECT COUNT(*) as count FROM users WHERE office_id = ?",
    args: [id],
  });

  const usersCount = Number(usersResult.rows[0]?.count || 0);
  if (usersCount > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Não é possível excluir um escritório que possui usuários vinculados.",
    });
  }

  await db.execute({
    sql: "DELETE FROM offices WHERE id = ?",
    args: [id],
  });

  return {
    success: true,
  };
});
