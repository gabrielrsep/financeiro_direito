import { db } from "../../database/connection";

export default defineEventHandler((event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Client ID is required",
        });
    }

    try {
        const stmt = db.prepare("DELETE FROM clients WHERE id = ?");
        const info = stmt.run(id);

        if (info.changes === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: "Not Found",
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
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
