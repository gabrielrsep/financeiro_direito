import { getUser } from "~~/server/util/auth";
import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {

  const { office_id } =  await getUser(event)!;

  const users = await db.execute({
    sql: "SELECT id, name, username, email, avatar_url, created_at FROM users WHERE office_id = ? ORDER BY name ASC",
    args: [office_id],
  });

  return users.rows;
});
