import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do escritório inválido.",
    });
  }

  const officeResult = await sql`SELECT id FROM offices WHERE id = ${id}`;

  if (officeResult.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Escritório não encontrado.",
    });
  }

  const usersResult = await sql`SELECT COUNT(*) as count FROM users WHERE office_id = ${id}`;

  const usersCount = Number(usersResult[0]?.count || 0);
  if (usersCount > 0) {
    throw createError({
      statusCode: 400,
      message: "Não é possível excluir um escritório que possui usuários vinculados.",
    });
  }

  await sql`DELETE FROM offices WHERE id = ${id}`;

  return {
    success: true,
  };
});
