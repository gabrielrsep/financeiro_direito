import { db, firstInit, sqlFolder } from "../database/connection";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export default defineNitroPlugin(async () => {
    if (firstInit && process.env.NODE_ENV === "development") {
        console.log("Initializing database for the first time...");
        
        const schemaPath = resolve(sqlFolder, "schema.sql");
        if (existsSync(schemaPath)) {
            const schema = readFileSync(schemaPath).toString();
            await db.execute(schema);
            console.log("Database schema applied.");
        }

        const seedPath = resolve(sqlFolder, "seed.sql");
        if (existsSync(seedPath)) {
            const seed = readFileSync(seedPath).toString();
            await db.execute(seed);
            console.log("Database seed applied.");
        }
    }
});
