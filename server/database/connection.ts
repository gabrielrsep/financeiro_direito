import { createClient } from "@libsql/client";
import { existsSync } from "fs";
import { resolve } from "path";

const { DATABASE_URL, DATABASE_AUTH_TOKEN, NODE_ENV } = process.env;

let authToken: string | undefined;

if (NODE_ENV === "production") {
    authToken = DATABASE_AUTH_TOKEN!;
}


console.log("Database URL: ", DATABASE_URL);
console.log("Database auth token: ", DATABASE_AUTH_TOKEN);
console.log("Node env: ", NODE_ENV);
const db = createClient({
    url: DATABASE_URL!,
    authToken,
});

const databasePath = DATABASE_URL!.replace("file:", "");
const firstInit = !existsSync(databasePath);
const sqlFolder = resolve(databasePath, "sql");

export { db, firstInit, sqlFolder };


