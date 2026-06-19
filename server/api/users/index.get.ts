import { neonClient as sql } from "../../database/connection";

type User = {id: string, name: string, username: string, email: string, avatar_url: string, created_at: string}

export default defineEventHandler(async (event) => {

  const { user } = await getUserSession(event);

  const query = getQuery(event)

  let q = (query.q as string) || null

  if (!user!.office_id) {
    throw createError({
      statusCode: 400,
      message: "ID do escritório é obrigatório.",
    });
  }


 let where = sql``
  if(q) {
    q = q + '%'
    where = sql` AND (${q} IS NULL OR email LIKE ${q} OR name LIKE ${q}) ORDER BY name ASC`
  } 

  const users = await sql`
    SELECT id, name, username, email, avatar_url, created_at
    FROM users 
    WHERE office_id = ${user!.office_id} ${where}`

  return users as User[];
});