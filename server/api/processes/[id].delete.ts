import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
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
                    statusMessage: "Not Found",
                    message: "Process not found",
                });
            }

            // If it was 'em_conta', adjust client debt
            if (process.payment_method === 'em_conta') {
                const totalPaidResult = await tx.execute({
                    sql: "SELECT SUM(value_paid) as total FROM payments WHERE process_id = ?",
                    args: [id]
                });
                const paidAmount = Number((totalPaidResult.rows[0] as any)?.total || 0);

                // The debt remaining for this process is (value_charged - paidAmount)
                // We must subtract this from the client's balance
                const debtToRemove = Number(process.value_charged) - paidAmount;

                await tx.execute({
                    sql: `
                        UPDATE clients 
                        SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `,
                    args: [debtToRemove, process.client_id]
                });
            }

            // Delete the process (cascades to payments)
            await tx.execute({
                sql: "DELETE FROM processes WHERE id = ?",
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
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
