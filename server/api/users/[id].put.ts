import { passwordError, validCredentials } from "~~/server/util/validation/http";
import { validPassword } from "~~/server/util/validation/func";
import { db } from "~~/server/database/connection";
import bcrypt from "bcrypt";
import { findFormDataValue, getFormDataValue, removeFile, uploadFile } from "~~/server/util/upload";
import { devLogger } from "~~/server/util/logger";

export default defineEventHandler(async (event) => {
  const session = getCookie(event, "auth_session");
  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Não autorizado.",
    });
  }

  const { office_id } = JSON.parse(session);
  const id = getRouterParam(event, "id");

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

  // Check if user exists and belongs to the same office
  const user = await db.execute({
    sql: "SELECT id, avatar_url FROM users WHERE id = ? AND office_id = ?",
    args: [id, office_id],
  });

  if (user.rows.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Usuário não encontrado.",
    });
  }

  // Check if username/email already taken by another user
  const existingUser = await db.execute({
    sql: "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
    args: [username, email, id],
  });

  if (existingUser.rows.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Usuário ou email já cadastrado por outra pessoa.",
    });
  }

  const transaction = await db.transaction('write')

  try {
    if(avatar) {
      const avatarUrl = user.rows[0].avatar_url as string;
      if (avatarUrl) {
          await removeFile(avatarUrl);
      }
      
      const blob = await uploadFile(body!, "avatar", 'avatar', {
        mimeType: ["image/jpeg", "image/png", "image/jpg"],
        fileSize: 1024 * 1024 * 2
      })
      await transaction.execute({
        sql: "UPDATE users SET avatar_url = ? WHERE id = ?",
        args: [blob.url, id],
      })
    }

    await transaction.execute({
      sql: "UPDATE users SET name = ?, username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [name, username, email, id],
    });

    if (password) {
      if (!validPassword(password)) {
        await transaction.rollback()
        throw passwordError()
      }
      const hashedPassword = await bcrypt.hash(password, Number(process.env.PASSWORD_ROUNDS || 12));
      await transaction.execute({
        sql: "UPDATE users SET password = ? WHERE id = ?",
        args: [hashedPassword, id],
      });
    }

    await transaction.commit()

    return { success: true };
  } catch (error: any) {
    devLogger.error(error)
    await transaction.rollback()
    throw createError({
      statusCode: 500,
      message: "Erro ao atualizar usuário.",
    });
  }
});
