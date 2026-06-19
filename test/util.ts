import { fetch, url } from '@nuxt/test-utils'

let _user: any

export function setCurrentUser(user: any) {
    _user = user
}

export async function getAuthCookie() {

    if(_user) {
        const res = await fetch(url('api/dev/_session'), { method: 'POST', body: JSON.stringify(_user) })
        const setCookieHeader = res.headers.get('set-cookie')
        const sessionCookie = setCookieHeader?.split(';')[0]!
        return { Cookie: sessionCookie }
    }

    return { Cookie: '' }
}