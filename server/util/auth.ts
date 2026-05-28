import type { H3Event } from "h3"

type User = {
    id: number;
    office_id: number;
    name: string;
    username: string;
    email: string;
}

export async function getUser(event: H3Event, cookieValue?: string) {
    /*
        In test environment, we allow passing a test user through the "x-test-user" header for easier testing without needing to set up authentication.
        This is only used when the "VITEST" environment variable is set,
        which indicates that we are running tests. In production,
        we rely on the "auth_session" cookie to identify the user session.
    */

    const session = cookieValue || getCookie(event, "auth_session");
    if(process.env.VITEST) {
       const headers = getRequestHeaders(event)
        if(headers['x-test-user'])
           return JSON.parse(headers['x-test-user'] as string) as User 
    }
    if (!session) {
        return null;
    }


    return JSON.parse(session) as User
}