import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do escritório inválido.",
    });
  }

  const { user } = await getUserSession(event)

  if(user?.office_id) {
    throw createError({
      status: 401,
      message: 'Você precisa ser um administrador para excluir um escritório'
    })
  }

  const body = await readBody(event);
  const name = (body.name || "").toString().trim();

  if (!name) {
    throw createError({
      statusCode: 400,
      message: "O nome do escritório é obrigatório.",
    });
  }

  const officeExists = await sql`SELECT id FROM offices WHERE id = ${id}`;

  if (officeExists.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Escritório não encontrado.",
    });
  }

  const duplicate = await sql`SELECT id FROM offices WHERE LOWER(name) = LOWER(${name}) AND id != ${id}`;

  if (duplicate.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Já existe um escritório com esse nome.",
    });
  }

  await sql`UPDATE offices SET name = ${name} WHERE id = ${id}`;

  return {
    success: true,
  };
});
