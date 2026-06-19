
export default defineEventHandler(async (event) => {
    if(process.env.VITEST || process.env.NODE_ENV === 'test')
        return undefined;

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
        '/password-recovery',
        '/api/auth/recovery-password',
        '/api/auth/reset-password',
        '/api/_auth/session'
    ]

    if(!allowedPaths.includes(url.pathname)) {
        await requireUserSession(event)
    }

});