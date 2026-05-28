import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do escritório inválido.",
    });
  }

  const body = await readBody(event);
  const name = (body.name || "").toString().trim();

  if (!name) {
    throw createError({
      statusCode: 400,
      message: "O nome do escritório é obrigatório.",
    });
  }

  const officeExists = await db.execute({
    sql: "SELECT id FROM offices WHERE id = ?",
    args: [id],
  });

  if (officeExists.rows.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Escritório não encontrado.",
    });
  }

  const duplicate = await db.execute({
    sql: "SELECT id FROM offices WHERE LOWER(name) = LOWER(?) AND id != ?",
    args: [name, id],
  });

  if (duplicate.rows.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Já existe um escritório com esse nome.",
    });
  }

  await db.execute({
    sql: "UPDATE offices SET name = ? WHERE id = ?",
    args: [name, id],
  });

  return {
    success: true,
  };
});
