import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Bad Request",
            message: "Client ID is required",
        });
    }

    try {
        const result = await db.execute({
            sql: "DELETE FROM clients WHERE id = ?",
            args: [id]
        });

        if (result.rowsAffected === 0) {
            throw createError({
                statusCode: 404,
                message: "Not Found",
                message: "Client not found",
            });
        }

        return {
            success: true,
            message: "Client deleted successfully",
        };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            message: "Internal Server Error",
            message: error.message,
        });
    }
});
