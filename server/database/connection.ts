import Database from "better-sqlite3";
import { readFileSync, existsSync } from "fs";

import { resolve } from "path";

const databaseFolder = resolve("server", "database");
const databasePath = process.env.DATABASE_PATH || resolve(databaseFolder, "db.sqlite");
const sqlFolder = resolve(databaseFolder, "sql");
const firstInit = !existsSync(databasePath);

const db = new Database(databasePath);

if(firstInit) {
    const schemaPath = resolve(sqlFolder, "schema.sql");
    const schema = readFileSync(schemaPath).toString();
    db.exec(schema);

    const seedPath = resolve(sqlFolder, "seed.sql");
    if(existsSync(seedPath)) {
        const seed = readFileSync(seedPath).toString();
        db.exec(seed);
    }

}

export { db }


