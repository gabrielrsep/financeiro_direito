import { db } from "~~/server/database/connection";
import { Resend } from "resend";
import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email } = body;

    if (!email) {
        throw createError({
            statusCode: 400,
            message: "Email is required",
        });
    }

    // ===== RATE LIMITING: Check for recent attempts (60 seconds) =====
    const recentAttempt = await db.execute({
        sql: `SELECT id FROM password_recovery_attempts 
              WHERE email = ? AND datetime(attempted_at) > datetime('now', '-60 seconds')
              LIMIT 1`,
        args: [email.toLowerCase()]
    });

    if (recentAttempt.rows.length > 0) {
        throw createError({
            statusCode: 429,
            message: "Too many requests. Please try again later.",
        });
    }

    // ===== Verify user exists =====
    const result = await db.execute({
        sql: "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
        args: [email]
    });

    if (result.rows.length === 0) {
        throw createError({
            statusCode: 404,
            message: "User not found",
        });
    }

    const trx = await db.transaction()
    // ===== Log the recovery attempt (for rate limiting) =====
    await trx.execute({
        sql: `INSERT INTO password_recovery_attempts (email, attempted_at) VALUES (?, datetime('now'))`,
        args: [email.toLowerCase()]
    });

    // ===== Cleanup old attempts (older than 24 hours) =====
    await trx.execute({
        sql: `DELETE FROM password_recovery_attempts 
              WHERE datetime(created_at) < datetime('now', '-24 hours')`
    });

    const resend = new Resend(process.env.RESEND_API_KEY!);
    const host = event.node.req.headers.host;
    const token = nanoid();

    // ===== Create recovery token =====
    await trx.execute({
        sql: `INSERT INTO password_recovery_tokens (user_id, token, expires_at) 
              VALUES (?, ?, datetime('now', '+1 hour'))`,
        args: [result.rows[0]!.id as string, token]
    });
    await trx.commit()

    if(process.env.VITEST) {
        return {
            success: true,
            message: "Recovery email sent if the user exists",
            token, // Return token for testing purposes
            to: email // Return email for testing purposes
        }
    }

    // ===== Send recovery email =====
    await resend.emails.send({
        from: process.env.RECOVERY_DOMAIN!,
        to: email,
        subject: "Recuperação de Senha",
        html: `<p>Clique no link abaixo para resetar sua senha:</p><a href="https://${host}/reset-password?token=${token}">Resetar Senha</a>`,
    });

    return {
        success: true,
        message: "Recovery email sent if the user exists"
    };
})