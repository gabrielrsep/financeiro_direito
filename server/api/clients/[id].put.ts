
import { writeFile } from "node:fs/promises";
import { db, databaseArgs } from "../../database/connection";


export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const { name, document, contact, address, is_recurrent, recurrence_value, recurrence_day } = body;

    if (!id || !name || !document) {
        throw createError({
            statusCode: 400,
            message: "Bad Request",
            message: "Client ID, name, and document are required",
        });
    }

    try {
        const result = await db.execute({
            sql: `UPDATE clients 
                  SET name = ?, document = ?, contact = ?, address = ?, is_recurrent = ?, recurrence_value = ?, recurrence_day = ?
                  WHERE id = ?`,
            args: databaseArgs(name, document, contact, address, is_recurrent ? 1 : 0, recurrence_value, recurrence_day, id)
        });

        if (result.rowsAffected === 0) {
            throw createError({
                statusCode: 404,
                message: "Not Found",
                message: "Client not found",
            });
        }

        const client = await db.execute({
            sql: `SELECT * FROM clients WHERE id = ?`,
            args: databaseArgs(id)
        });

        return {
            success: true,
            message: "Client updated successfully",
            data: client.rows[0]
        };
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: "Conflict",
                message: "Client with this document already exists",
            });
        }
        if (error.statusCode) throw error;
        await writeFile("error.txt", error.message);
        throw createError({
            statusCode: 500,
            message: "Internal Server Error",
            message: error.message,
        });
    }
});
