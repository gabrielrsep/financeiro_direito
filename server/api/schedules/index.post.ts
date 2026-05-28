import { databaseArgs, db } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { process_id, service_id, client_id, amount, movement_date, description } = body;

    // Validate required fields
    if ((!process_id && !service_id && !client_id) || amount === undefined || !movement_date) {
        throw createError({
            statusCode: 400,
            message: "At least one of (Process ID, Service ID, Client ID), Amount, and Movement Date are required",
        });
    }

    if (amount <= 0) {
        throw createError({
            statusCode: 400,
            message: "Amount must be greater than 0",
        });
    }

    try {

        // Insert the schedule (charge)
        const result = await db.execute({
            sql: `
                INSERT INTO financial_movements 
                (process_id, service_id, client_id, type, amount, movement_date, description) 
                VALUES (?, ?, ?, 'charge', ?, ?, ?) 
                RETURNING id
            `,
            args: databaseArgs(process_id, service_id, client_id, amount, movement_date, description || null)
        });

        const row = result.rows[0];
        const scheduleId = Number(row.id);

        return {
            success: true,
            data: {
                id: scheduleId,
                process_id,
                service_id,
                client_id,
                amount,
                movement_date,
                description,
                type: 'charge'
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
