import { neonClient as sql } from "../../database/connection";

export default defineEventHandler(async (event) => {

  const body = await readBody(event);
  const name = (body.name || "").toString().trim();

  if (!name) {
    throw createError({
      status: 400,
      message: "O nome do escritório é obrigatório.",
    });
  }

  const { user } = await getUserSession(event)

  if(user!.office_id) {
    throw createError({
      status: 401,
      message: 'Você não tem permição para adicioar novos escritórios'
    })
  }


  const existingOffice = await sql`SELECT id FROM offices WHERE LOWER(name) = LOWER(${name})`;

  if (existingOffice.length > 0) {
    throw createError({
      status: 409,
      message: "Já existe um escritório com esse nome.",
    });
  }

  try {
    const result = await sql`INSERT INTO offices (name) VALUES (${name}) RETURNING id`;

    return {
      success: true,
      id: Number(result[0]?.id),
    };
  } catch (error: any) {
    throw createError({
      status: 500,
      message: error.message,
    });
  }
});
