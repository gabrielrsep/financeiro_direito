import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id } = body;

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "ID is required",
        });
    }

    try {
        const stmt = db.prepare(`
            DELETE FROM payments
            WHERE id = ?
        `);
        stmt.run(id);

        return {
            success: true,
            message: "Payment deleted successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});