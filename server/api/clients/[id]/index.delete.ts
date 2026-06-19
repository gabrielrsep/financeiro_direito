import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Client ID is required",
        });
    }

    const getOffice = await sql`SELECT office_id FROM clients WHERE id = ${id} AND deleted_at IS NULL`;

    if(getOffice.length === 0) {
        throw createError({
            statusCode: 404,
            message: "Client not found",
        })
    }

    const office_id = getOffice[0]?.office_id;

    const { user } = await getUserSession(event);


    if (user?.office_id && user?.office_id !== office_id) {
        throw createError({
            statusCode: 403,
            message: "Você não tem permissão para deletar este cliente",
        });
    }
    

    try {
        await sql`UPDATE clients SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

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
