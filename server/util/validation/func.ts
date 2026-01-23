export const validUsername = (username: string) => {
    const lowerCaseUsername = username.toLowerCase()

    const sameCharacters = (username: string) => {
        let char = username[0];
        for(const c of username) {
        if (c !== char)
            return false;
        }
        return true;
    }

    return lowerCaseUsername.match(/^[a-z][a-z0-9_]{2,}$/) && !sameCharacters(lowerCaseUsername)
}

export const validPassword = (password: string) => {
    return password.length >= 6
}

export const validEmail = (email: string) => {
    return email.match(/^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/)
}