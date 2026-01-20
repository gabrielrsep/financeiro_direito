import { existsSync } from "node:fs";

export default defineNitroPlugin(async () => {
    const { DATABASE_URL } = process.env;
    const databaseFile = DATABASE_URL!.replace("file:", "")
    const firstInit = !existsSync(databaseFile)


    if(process.env.NODE_ENV === 'production') {
        return
    }

    const { db } = await import("../database/connection");

    if (firstInit) {
        console.log("Initializing database for the first time...");

        try {
            const schema = await import("../database/sql/schema");
            db.executeMultiple(schema.default);
            console.log("Database schema applied.");
        } catch (error) {
            console.error('Failed to apply schema', JSON.stringify(error))
        }


        const seed = await import("../database/sql/seed");
        db.executeMultiple(seed.default);
        console.log("Database seed applied.");
    }
});
