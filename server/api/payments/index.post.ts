import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id, process_id, value_paid, payment_date, status, due_date } = body;

    if (!process_id || value_paid === undefined) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Process ID and Value Paid are required",
        });
    }

    try {
        // Start a transaction
        const transaction = db.transaction(() => {
            if (id) {
                // Update existing payment (e.g., marking a pending installment as paid)
                const stmtUpdate = db.prepare(`
                    UPDATE payments 
                    SET value_paid = ?, payment_date = ?, status = ?, due_date = ?
                    WHERE id = ?
                `);
                stmtUpdate.run(value_paid, payment_date || new Date().toISOString(), status || 'Pago', due_date, id);
                return id;
            } else {
                // 1. Insert payment record
                const stmtPayment = db.prepare(`
                    INSERT INTO payments (process_id, value_paid, payment_date, status, due_date)
                    VALUES (?, ?, ?, ?, ?)
                `);
                const info = stmtPayment.run(
                    process_id, 
                    value_paid, 
                    payment_date || new Date().toISOString(), 
                    status || 'Pago',
                    due_date
                );

                return info.lastInsertRowid;
            }
        });

        const lastId = transaction();

        return {
            success: true,
            data: {
                id: lastId,
                process_id,
                value_paid,
                payment_date,
                status,
                due_date
            },
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
