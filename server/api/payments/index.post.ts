import { databaseArg, neonClient as sql } from "~~/server/database/connection";


export default defineEventHandler(async (event) => {
    const body = await readBody<Payment>(event);
    const { process_id, service_id, client_id, value_paid, payment_date, description, type } = body;
    let date: string | undefined = payment_date;

    if ((!process_id && !service_id && !client_id) || value_paid === undefined) {
        throw createError({
            status: 400,
            message: "Process ID, Service ID or Client ID, and Value Paid are required",
        });
    }

    if((type !== 'payment' && type !== 'charge') || !type) {
        throw createError({
            status: 400,
            message: 'field type is needed and only can be \'payment\' or \'charge\''
        })
    }

    if(value_paid <= 0) {
        throw createError({
            status: 400,
            message: 'field \'value_paid\' should be greader then 0'
        })
    }

    const { user } = await getUserSession(event)
    if(!payment_date) {
        date = new Date().toISOString().split('T')[0];
    }
    try {
        let lastId: number | string;
        
        const result = await sql`
            INSERT INTO financial_movements (
                process_id, service_id, client_id, type, amount, movement_date, office_id,
                description
            )
            VALUES (
                ${databaseArg(process_id)},
                ${databaseArg(service_id)},
                ${databaseArg(client_id)},
                ${type},
                ${databaseArg(value_paid)},
                ${databaseArg(date)},
                ${databaseArg(user!.office_id)},
                ${description || null}
            )
            RETURNING id
        `
        const row = result[0];
        lastId = Number(row!.id);

        return {
            success: true,
            data: {
                id: lastId,
                process_id,
                service_id,
                client_id,
                value_paid,
                type,
                payment_date: date,
            },
        };
    } catch (error: any) {
        throw createError({
            status: 500,
            message: error.message,
            statusText: error.message
        });
    }
});
