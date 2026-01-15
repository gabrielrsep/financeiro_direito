import { createClient } from "@libsql/client";

const { DATABASE_URL, DATABASE_AUTH_TOKEN, NODE_ENV } = process.env;

let authToken: string | undefined

if (NODE_ENV === "production") {
    authToken = DATABASE_AUTH_TOKEN!;
}


const db = createClient({
    url: DATABASE_URL!,
    authToken,
});


export { db };


