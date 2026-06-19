import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {

  const id = Number(getRouterParam(event, "id"));
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do escritório inválido.",
    });
  }

  const officeResult = await sql`SELECT id, name, created_at FROM offices WHERE id = ${id}`;

  if (officeResult.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Escritório não encontrado.",
    });
  }
  return {
    success: true,
    data: officeResult[0],
  };
});
