import { passwordError, validCredentials } from "~~/server/util/validation/http";
import { validPassword } from "~~/server/util/validation/func";
import { neonClient as sql } from "~~/server/database/connection";
import bcrypt from "bcrypt";
import { findFormDataValue, getFormDataValue, removeFile, uploadFile } from "~~/server/util/upload";
import { devLogger } from "~~/server/util/logger";

export default defineEventHandler(async (event) => {

  const { user: loggedUser } = await getUserSession(event);
  const office_id = loggedUser!.office_id
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do usuário é obrigatório.",
    });
  }

  const body = await readMultipartFormData(event);
  const name = getFormDataValue(body, "name");
  const username = getFormDataValue(body, "username");
  const email = getFormDataValue(body, "email");
  const password = getFormDataValue(body, "password");
  const avatar = findFormDataValue(body, "avatar");

  if (!name || !username || !email) {
    throw createError({
      statusCode: 400,
      message: "Nome, usuário e email são obrigatórios.",
    });
  }

  validCredentials({username, email})

  // Check if user exists
  const databaseUsers = await sql`SELECT id, avatar_url, office_id FROM users WHERE id = ${id}`

  if (databaseUsers.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Usuário não encontrado.",
    });
  }
  const databaseUser = databaseUsers[0]

  if(office_id && databaseUser!.office_id != office_id) {
    throw createError({
      status: 401,
      message: "You dont have permission to edit this user",
    })
  }

  // Check if username/email already taken by another user
  const existingUser = await sql`SELECT id FROM users WHERE (username = ${username} OR email = ${email}) AND id != ${id}`

  if (existingUser.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Usuário ou email já cadastrado por outra pessoa.",
    });
  }


  const trxs = []
  try {
    if(avatar) {
      const avatarUrl = databaseUser!.avatar_url as string;
      if (avatarUrl) {
        await removeFile(avatarUrl);
      }
      
      const blob = await uploadFile(body!, "avatar", 'avatar', {
        mimeType: ["image/jpeg", "image/png", "image/jpg"],
        fileSize: 1024 * 1024 * 2
      })


      trxs.push(sql`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${id}`)
    }

    trxs.push(sql`UPDATE users SET name = ${name}, username = ${username}, email = ${email}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`)

    if (password) {
      if (!validPassword(password)) {
        throw passwordError()
      }
      const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS || 12));
      trxs.push(sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${id}`)
    }

    await sql.transaction(trxs)

    return { success: true };
  } catch (error: any) {
    devLogger.error(error)
    throw createError({
      statusCode: 500,
      message: "Erro ao atualizar usuário.",
    });
  }
});
