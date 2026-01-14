import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const { name, document, contact, address } = body;

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Client ID is required",
        });
    }

    try {
        const stmt = db.prepare(
            "UPDATE clients SET name = ?, document = ?, contact = ?, address = ? WHERE id = ?"
        );
        const info = stmt.run(name, document, contact, address, id);

        if (info.changes === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: "Not Found",
                message: "Client not found",
            });
        }

        return {
            success: true,
            message: "Client updated successfully",
        };
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw createError({
                statusCode: 409,
                statusMessage: "Conflict",
                message: "Client with this document already exists",
            });
        }
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
