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
        const tx = await db.transaction("write");
        try {
            let lastId: number | string;
            if (id) {
                // Update existing payment (e.g., marking a pending installment as paid)
                await tx.execute({
                    sql: `
                        UPDATE payments 
                        SET value_paid = ?, payment_date = ?, status = ?, due_date = ?
                        WHERE id = ?
                    `,
                    args: [value_paid, payment_date || new Date().toISOString(), status || 'Pago', due_date, id]
                });
                lastId = id;
            } else {
                // 1. Insert payment record
                const result = await tx.execute({
                    sql: `
                        INSERT INTO payments (process_id, value_paid, payment_date, status, due_date)
                        VALUES (?, ?, ?, ?, ?)
                    `,
                    args: [process_id, value_paid, payment_date || new Date().toISOString(), status || 'Pago', due_date]
                });
                lastId = Number(result.lastInsertRowid);
            }

            await tx.commit();

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
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
