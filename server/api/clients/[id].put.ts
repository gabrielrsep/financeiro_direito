
import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const { name, document, contact, address, is_recurrent, recurrence_value, recurrence_day } = body;

    if (!id || !name || !document) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Client ID, name, and document are required",
        });
    }

    try {
        const result = await db.execute({
            sql: `UPDATE clients 
                  SET name = ?, document = ?, contact = ?, address = ?, is_recurrent = ?, recurrence_value = ?, recurrence_day = ?
                  WHERE id = ?`,
            args: [name, document, contact, address, is_recurrent ? 1 : 0, recurrence_value, recurrence_day, id]
        });

        if (result.rowsAffected === 0) {
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
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
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
