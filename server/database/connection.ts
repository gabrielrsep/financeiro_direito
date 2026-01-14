import { createClient } from "@libsql/client";
import { existsSync } from "fs";
import { resolve } from "path";

const { DATABASE_URL } = process.env;

const db = createClient({
    url: DATABASE_URL!,
});

const databasePath = DATABASE_URL!.replace("file:", "");
const firstInit = !existsSync(databasePath);
const sqlFolder = resolve(databasePath, "sql");

export { db, firstInit, sqlFolder };


