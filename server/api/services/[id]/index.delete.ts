import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Service ID is required",
        });
    }

    // Check if service exists
    const serviceResult = await sql`SELECT office_id FROM services WHERE id = ${id} AND deleted_at IS NULL`
    const currentService = serviceResult[0]

    if (!currentService) {
        throw createError({
            status: 404,
            message: "Service not found",
        });
    }

    const { user } = await getUserSession(event)

    if (user!.office_id && currentService!.office_id != user!.office_id) {
        throw createError({
            statusCode: 403,
            message: "You don't have permission to delete this payment",
        });
    }


    try {

        // Soft delete the service
        await sql`UPDATE services SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`

        return {
            success: true,
            message: "Service deleted successfully"
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
