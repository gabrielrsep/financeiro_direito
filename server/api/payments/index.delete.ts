import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id } = body;

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID is required",
        });
    }

    try {
        await db.execute({
            sql: `
                DELETE FROM payments
                WHERE id = ?
            `,
            args: [id]
        });

        return {
            success: true,
            message: "Payment deleted successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});