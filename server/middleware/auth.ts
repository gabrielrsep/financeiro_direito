import { getUser } from "../util/auth";

export default defineEventHandler(async (event) => {
    if(process.env.VITEST)
        return;

    const url = getRequestURL(event)

    /**
     * Rotas que não exigem autenticação:
     */
    const allowedPaths = [
        '/api/auth/setup',
        '/api/auth/login',
        '/login',
        '/reset-password',
        '/',
        '/api/auth/check-setup',
        '/api/auth/user',
        '/password-recovery',
        '/api/auth/recovery-password',
        '/api/auth/reset-password'
    ]

    // Permitir acesso as rotas públicas sem autenticação
    if(!allowedPaths.includes(url.pathname)) {
        const session = await getUser(event, getCookie(event, "auth_session"));
        if (!session) {
            throw createError({
                statusCode: 401,
                message: "Não autorizado.",
            });
        }
    }

});