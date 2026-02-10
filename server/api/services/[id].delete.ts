import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Service ID is required",
        });
    }

    try {
        // Check if service exists
        const serviceResult = await db.execute({
            sql: "SELECT id FROM services WHERE id = ? AND deleted_at IS NULL",
            args: [id]
        });

        if (!serviceResult.rows[0]) {
            throw createError({
                statusCode: 404,
                message: "Service not found",
            });
        }

        // Soft delete the service
        await db.execute({
            sql: "UPDATE services SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            args: [id]
        });

        return {
            success: true,
            message: "Service deleted successfully"
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "Error deleting service",
        });
    }
});
