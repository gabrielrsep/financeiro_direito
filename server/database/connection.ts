import { createClient, type Client } from "@libsql/client";

const { DATABASE_URL, DATABASE_AUTH_TOKEN } = process.env;

let db: Client

db = createClient({
    url: DATABASE_URL!,
    authToken: DATABASE_AUTH_TOKEN,
})

export function databaseArgs(...args: any[]) {
    const newArgs = args.flat()
    for (let i = 0; i < newArgs.length; i++) {
        if (newArgs[i] === undefined) {
            newArgs[i] = null
        }
    }
    return newArgs
}

export { db };


