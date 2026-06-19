import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID é obrigatório.",
        });
    }

    try {
        const result = await sql`
            UPDATE office_expenses 
            SET deleted_at = CURRENT_TIMESTAMP 
            WHERE id = ${id} AND deleted_at IS NULL RETURNING id
        `;
        if (result.length === 0) {
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
