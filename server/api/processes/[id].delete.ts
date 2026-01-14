import { db } from "../../database/connection";

export default defineEventHandler((event) => {
    const id = event.context.params?.id;

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "ID is required",
        });
    }

    try {
        db.transaction(() => {
            // Get process info before deleting to check if it was 'em_conta'
            const process = db.prepare("SELECT client_id, value_charged, payment_method FROM processes WHERE id = ?").get(id) as any;

            if (!process) {
                throw createError({
                    statusCode: 404,
                    statusMessage: "Not Found",
                    message: "Process not found",
                });
            }

            // If it was 'em_conta', adjust client debt
            if (process.payment_method === 'em_conta') {
                const totalPaid = db.prepare("SELECT SUM(value_paid) as total FROM payments WHERE process_id = ?").get(id) as any;
                const paidAmount = totalPaid?.total || 0;

                // The debt remaining for this process is (value_charged - paidAmount)
                // We must subtract this from the client's balance
                const debtToRemove = process.value_charged - paidAmount;

                db.prepare(`
                    UPDATE clients 
                    SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `).run(debtToRemove, process.client_id);
            }

            // Delete the process (cascades to payments)
            db.prepare("DELETE FROM processes WHERE id = ?").run(id);
        })();

        return {
            success: true,
            message: "Process deleted successfully",
        };
    } catch (error: any) {
        if (error.statusCode === 404) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
