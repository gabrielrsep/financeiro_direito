import { databaseArgs, db } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id, process_id, client_id, value_paid, payment_date, status } = body;

    if ((!process_id && !client_id) || value_paid === undefined) {
        throw createError({
            statusCode: 400,
            message: "Process ID or Client ID, and Value Paid are required",
        });
    }

    try {
        let lastId: number | string;
        
        if (id) {
            // Update existing payment
             await db.execute({
                sql: `UPDATE payments SET value_paid = ?, payment_date = ?, status = ? WHERE id = ?`,
                args: [value_paid, payment_date, status || 'Pago', id]
            })
            lastId = id;
        } else {
             const result = await db.execute({
                sql: `INSERT INTO payments (process_id, client_id, value_paid, payment_date, status) VALUES (?, ?, ?, ?, ?) RETURNING id`,
                args: databaseArgs(process_id, client_id, value_paid, payment_date, status || 'Pago')
            })
            const row = result.rows[0];
            lastId = Number(row.id);
        }

        return {
            success: true,
            data: {
                id: lastId,
                process_id,
                client_id,
                value_paid,
                payment_date,
                status
            },
        };
    } catch (error: any) {
        console.error(error);
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
