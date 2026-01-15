import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";


export default defineNitroPlugin(async () => {
    const { DATABASE_URL } = process.env;
    const databaseFile = DATABASE_URL!.replace("file:", "")
    const databasePath = dirname(databaseFile)
    const firstInit = !existsSync(databaseFile)

    const sqlFolder = resolve(process.cwd(), "server/database/sql")

    const { db } = await import("../database/connection");

    if (firstInit && process.env.NODE_ENV === "development") {
        console.log("Initializing database for the first time...");

        const schema = readFileSync(resolve(sqlFolder, "schema.sql")).toString();
        db.executeMultiple(schema);

        console.log("Database schema applied.");

        const seed = readFileSync(resolve(sqlFolder, "seed.sql")).toString();
        db.executeMultiple(seed);
        console.log("Database seed applied.");
    }
});
