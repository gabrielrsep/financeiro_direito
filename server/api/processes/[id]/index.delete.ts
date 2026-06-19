import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID is required",
        });
    }

    const { user } = await getUserSession(event)

    try {
        const processResult = await sql`SELECT office_id FROM processes WHERE id = ${id}`
        
        const process = processResult[0];

        if (!process) {
            throw createError({
                statusCode: 404,
                message: "Process not found",
            });
        }


        if (process.office_id !== user!.office_id) {
            throw createError({
                statusCode: 403,
                message: "Você não tem permissão para excluir este processo",
            })
        }

        await sql`UPDATE processes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`

        return {
            success: true,
            message: "Process deleted successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
