import { db } from "../../database/connection";

export default defineEventHandler((event) => {
    const id = getRouterParam(event, 'id');

    try {
        const stmt = db.prepare(`
            UPDATE office_expenses 
            SET deleted_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND deleted_at IS NULL
        `);
        
        const result = stmt.run(id);

        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: "Gasto não encontrado.",
            });
        }

        return {
            success: true
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || "Internal Server Error",
            message: error.message,
        });
    }
});
