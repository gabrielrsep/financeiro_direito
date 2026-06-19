import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {

  const { user: currentUser } = await getUserSession(event);
  const id = getRouterParam(event, "id");
  const currentUserId = currentUser!.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do usuário é obrigatório.",
    });
  }

  if (Number(id) === Number(currentUserId)) {
    throw createError({
      status: 400,
      message: "Você não pode excluir seu próprio usuário.",
    });
  }

  // Check if user exists and belongs to the same office
  const user = await sql`SELECT id FROM users WHERE id = ${id}`

  if (user.length === 0) {
    throw createError({
      status: 404,
      message: "Usuário não encontrado.",
    });
  }

  try {
    await sql`DELETE FROM users WHERE id = ${id}`
    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Erro ao excluir usuário.",
    });
  }
});
