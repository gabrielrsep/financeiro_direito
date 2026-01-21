import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID is required",
        });
    }

    try {
        const tx = await db.transaction("write");
        try {
            // Get process info before deleting to check if it was 'em_conta'
            const processResult = await tx.execute({
                sql: "SELECT client_id, value_charged, payment_method FROM processes WHERE id = ?",
                args: [id]
            });
            const process = processResult.rows[0];

            if (!process) {
                throw createError({
                    statusCode: 404,
                    message: "Process not found",
                });
            }

            // Delete the process (cascades to payments)
            await tx.execute({
                sql: "UPDATE processes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
                args: [id]
            });

            await tx.commit();

            return {
                success: true,
                message: "Process deleted successfully",
            };
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    } catch (error: any) {
        if (error.statusCode === 404) throw error;
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
