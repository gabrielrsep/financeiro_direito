import { validEmail, validPassword, validUsername } from "./func"

type Credentials = {
    username: string,
    email: string,
    password?: string
}

export const passwordError = () => {
    return createError({
        statusCode: 400,
        message: "Senha deve ter pelo menos 6 caracteres.",
    })
}

export const validCredentials = ({username, email, password}: Credentials) => {
    if(!validUsername(username))
        throw createError({
            statusCode: 400,
            message: "O nome de usuário deve começar com uma letra, seguida de pelo menos 2 caracteres que podem ser letras, números ou sublinhados.",
        })
    if(password && !validPassword(password))
        throw passwordError()
    if(!validEmail(email))
        throw createError({
            statusCode: 400,
            message: "Email inválido.",
        })
    return true
}