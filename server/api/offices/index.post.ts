import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {

  const body = await readBody(event);
  const name = (body.name || "").toString().trim();

  if (!name) {
    throw createError({
      statusCode: 400,
      message: "O nome do escritório é obrigatório.",
    });
  }

  try {
    const existingOffice = await db.execute({
      sql: "SELECT id FROM offices WHERE LOWER(name) = LOWER(?)",
      args: [name],
    });

    if (existingOffice.rows.length > 0) {
      throw createError({
        statusCode: 409,
        message: "Já existe um escritório com esse nome.",
      });
    }

    const result = await db.execute({
      sql: "INSERT INTO offices (name) VALUES (?)",
      args: [name],
    });

    return {
      success: true,
      id: Number(result.lastInsertRowid),
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
