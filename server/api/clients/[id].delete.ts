import { db } from "../../database/connection";
import { getUser } from "~~/server/util/auth";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Client ID is required",
        });
    }

    const getOffice = await db.execute('SELECT office_id FROM clients WHERE id = ? AND deleted_at IS NULL', [id]);

    if(getOffice.rows.length === 0) {
        throw createError({
            statusCode: 404,
            message: "Client not found",
        })
    }

    const office_id = getOffice.rows[0]?.office_id;

    const user = await getUser(event);

    if (user?.office_id !== office_id) {
        throw createError({
            statusCode: 403,
            message: "Você não tem permissão para deletar este cliente",
        });
    }
    

    try {
        const result = await db.execute({
            sql: "UPDATE clients SET deleted_at = datetime('now') WHERE id = ?",
            args: [id]
        });

        if (result.rowsAffected === 0) {
            throw createError({
                statusCode: 404,
                message: "Client not found",
            });
        }

        return {
            success: true,
            message: "Client deleted successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
