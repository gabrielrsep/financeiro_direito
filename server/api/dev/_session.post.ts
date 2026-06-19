/**
 * Rota usada nos testes para obter o cookie de autenticação e usar nas requisições que precisam
 */
export default defineEventHandler(async event => {
    const body = await readBody(event)
    const session = await setUserSession(event, {
        user: JSON.parse(body)
    })

    return session
})