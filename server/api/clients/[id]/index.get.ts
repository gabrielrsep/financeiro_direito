import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Client ID is required",
        });
    }

    const clientResult = await sql`SELECT * FROM clients WHERE id = ${id} AND deleted_at IS NULL`;
    const client = clientResult[0];


    if (!client) {
        throw createError({
            statusCode: 404,
            message: "Client not found",
        });
    }

    // Get processes for this client

    const processes = await sql`
        SELECT * FROM processes 
        WHERE client_id = ${id} AND deleted_at IS NULL 
        ORDER BY created_at DESC`

    // Get services for this client
    const services = await sql`
        SELECT * FROM services 
        WHERE client_id = ${id} AND deleted_at IS NULL 
        ORDER BY created_at DESC`

    // Get financial summary
    // 1. Total Charged (from processes + services)
    const financialResult = await sql`
        SELECT 
            COALESCE(SUM(value_charged), 0) as total_charged
        FROM (
            SELECT value_charged FROM processes WHERE client_id = ${id} AND deleted_at IS NULL
            UNION ALL
            SELECT value_charged FROM services WHERE client_id = ${id} AND deleted_at IS NULL
        )`
    const total_charged = Number((financialResult[0] as { total_charged: string }).total_charged);

    // 2. Total Paid (from payments linked to processes and services)
    const paymentsResult = await sql`
        SELECT 
            COALESCE(SUM(amount), 0) as total_paid
        FROM financial_movements
        WHERE type = 'payment'
        AND (
            (process_id IS NOT NULL AND process_id IN (
                SELECT id FROM processes WHERE client_id = ${id} AND deleted_at IS NULL
            ))
            OR
            (service_id IS NOT NULL AND service_id IN (
                SELECT id FROM services WHERE client_id = ${id} AND deleted_at IS NULL
            ))
            OR
            (client_id = ${id} AND process_id IS NULL AND service_id IS NULL)
        )`
    const total_paid = Number((paymentsResult[0] as any).total_paid);

    const balance = total_charged - total_paid;

    return {
        success: true,
        data: {
            ...client,
            processes,
            services,
            financial: {
                total_charged,
                total_paid,
                balance
            }
        },
    };
});
