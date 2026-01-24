import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
  const session = getCookie(event, "auth_session");
  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Não autorizado.",
    });
  }

  const { office_id } = JSON.parse(session);

  const users = await db.execute({
    sql: "SELECT id, name, username, email, avatar_url, created_at FROM users WHERE office_id = ? ORDER BY name ASC",
    args: [office_id],
  });

  return users.rows;
});
