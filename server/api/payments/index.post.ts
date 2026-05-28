import { databaseArgs, db } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { process_id, service_id, client_id, value_paid, payment_date } = body;
    let date: string | undefined = payment_date;

    if ((!process_id && !service_id && !client_id) || value_paid === undefined) {
        throw createError({
            statusCode: 400,
            message: "Process ID, Service ID or Client ID, and Value Paid are required",
        });
    }

    if(!payment_date) {
        date = new Date().toISOString();
    }
    try {
        let lastId: number | string;
        
        const result = await db.execute({
            sql: `INSERT INTO financial_movements (process_id, service_id, client_id, type, amount, movement_date) VALUES (?, ?, ?, 'payment', ?, ?) RETURNING id`,
            args: databaseArgs(process_id, service_id, client_id, value_paid, date)
        });
        const row = result.rows[0];
        lastId = Number(row.id);

        return {
            success: true,
            data: {
                id: lastId,
                process_id,
                service_id,
                client_id,
                value_paid,
                payment_date: date,
            },
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
