import { neonClient } from "../../database/connection";
import bcrypt from "bcrypt";
import { validCredentials } from "~~/server/util/validation/http";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { officeName, adminName, username, email, password } = body;

  // 1. Validation
  if (!officeName || !adminName || !username || !email || !password) {
    throw createError({
      statusCode: 400,
      message: "Todos os campos são obrigatórios.",
    });
  }

  validCredentials({username, email, password})

  // 2. Check if users already exist
  const existingUsers = await neonClient`SELECT COUNT(*) as count FROM users`;
  if (Number(existingUsers[0]?.count || 0) > 0) {
    throw createError({
      statusCode: 403,
      message: "O sistema já foi configurado.",
    });
  }

  try {
    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS || 12));

    const result = await neonClient`
    with
      new_office as (
      insert
        into
          offices (name)
        values (${officeName}) returning id
      ),
      new_user as (
      insert
        into
          users (office_id, name, username, email, password)
          select
            id,
            ${adminName},
            ${username},
            ${email},
            ${hashedPassword}
          from
            new_office
        returning id as user_id,
            office_id
      )
      select
        user_id,
        office_id
      from
        new_user
    `;

    const userId = Number(result[0]?.user_id);
    const officeId = Number(result[0]?.office_id);

    // 5. Success - Set Session Cookie
    const sessionData = {
      id: userId,
      name: adminName,
      username: username,
      office_id: officeId,
      office_name: officeName,
    };

    await setUserSession(event, sessionData)
    
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Erro interno ao configurar o sistema: " + error.message,
    });
  }
});
