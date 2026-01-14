import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, document, contact, address } = body;

    if (!name || !document) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Name and Document are required",
        });
    }

    try {
        const stmt = db.prepare(
            "INSERT INTO clients (name, document, contact, address) VALUES (?, ?, ?, ?)"
        );
        const info = stmt.run(name, document, contact, address);

        return {
            success: true,
            data: {
                id: info.lastInsertRowid,
                name,
                document,
                contact,
                address,
            },
        };
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw createError({
                statusCode: 409,
                statusMessage: "Conflict",
                message: "Client with this document already exists",
            });
        }
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
