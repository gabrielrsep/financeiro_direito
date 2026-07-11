import { neonClient } from "~~/server/database/connection";
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
    const recentAttempt = await neonClient`SELECT id FROM password_recovery_attempts 
              WHERE lower(email) = ${email.toLowerCase()} AND attempted_at > CURRENT_TIMESTAMP - INTERVAL '60 SECOND'
              LIMIT 1`;

    if (recentAttempt.length > 0) {
        throw createError({
            statusCode: 429,
            message: "Too many requests. Please try again later.",
        });
    }

    // ===== Verify user exists =====
    const result = await neonClient`SELECT id FROM users WHERE LOWER(email) = LOWER(${email})`;

    if (result.length === 0) {
        throw createError({
            statusCode: 404,
            message: "User not found",
        });
    }

    const host = getRequestHost(event)
    const proto = getRequestProtocol(event)
    const token = nanoid();
    const resend = new Resend(process.env.RESEND_API_KEY!);

    await neonClient.transaction([
        neonClient`INSERT INTO password_recovery_attempts (email, attempted_at) VALUES (${email.toLowerCase()}, CURRENT_TIMESTAMP)`,
        neonClient`DELETE FROM password_recovery_attempts WHERE attempted_at < CURRENT_TIMESTAMP - INTERVAL '24 HOUR'`,
        neonClient`INSERT INTO password_recovery_tokens (user_id, token, expires_at)
              VALUES (${result[0]!.id as string}, ${token}, CURRENT_TIMESTAMP + INTERVAL '1 HOUR')`,
    ]);

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
        html: `<p>Clique no link abaixo para resetar sua senha:</p><a href="${proto}://${host}/reset-password?token=${token}">Resetar Senha</a>`,
    });

    return {
        success: true,
        message: "Recovery email sent if the user exists"
    };
})