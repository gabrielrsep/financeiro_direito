import { getUser } from "~~/server/util/auth";
import { db } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID is required",
        });
    }

    const user = await getUser(event)

    try {
        const tx = await db.transaction();
        const processResult = await tx.execute({
            sql: "SELECT office_id FROM processes WHERE id = ?",
            args: [id]
        });
        const process = processResult.rows[0];

        if (!process) {
            throw createError({
                statusCode: 404,
                message: "Process not found",
            });
        }


        if (process.office_id !== user!.office_id) {
            throw createError({
                statusCode: 403,
                statusMessage: "Você não tem permissão para excluir este processo",
            })
        }

        await tx.execute({
            sql: "UPDATE processes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            args: [id]
        });

        await tx.commit();

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
