import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID é obrigatório.",
        });
    }

    try {
        const result = await db.execute({
            sql: `
                UPDATE office_expenses 
                SET deleted_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND deleted_at IS NULL
            `,
            args: [id]
        });

        if (result.rowsAffected === 0) {
            throw createError({
                statusCode: 404,
                message: "Gasto não encontrado.",
            });
        }

        return {
            success: true
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message,
        });
    }
});
