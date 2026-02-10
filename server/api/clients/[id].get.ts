import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Client ID is required",
        });
    }

    try {
        const clientResult = await db.execute({
            sql: "SELECT * FROM clients WHERE id = ?",
            args: [id]
        });
        const client = clientResult.rows[0];

        if (!client) {
            throw createError({
                statusCode: 404,
                message: "Client not found",
            });
        }

        // Get processes for this client
        const processesResult = await db.execute({
            sql: `
                SELECT * FROM processes 
                WHERE client_id = ? AND deleted_at IS NULL 
                ORDER BY created_at DESC
            `,
            args: [id]
        });
        const processes = processesResult.rows;

        // Get services for this client
        const servicesResult = await db.execute({
            sql: `
                SELECT * FROM services 
                WHERE client_id = ? AND deleted_at IS NULL 
                ORDER BY created_at DESC
            `,
            args: [id]
        });
        const services = servicesResult.rows;

        // Get financial summary
        // 1. Total Charged (from processes + services)
        const financialResult = await db.execute({
            sql: `
                SELECT 
                    COALESCE(SUM(value_charged), 0) as total_charged
                FROM (
                    SELECT value_charged FROM processes WHERE client_id = ? AND deleted_at IS NULL
                    UNION ALL
                    SELECT value_charged FROM services WHERE client_id = ? AND deleted_at IS NULL
                )
            `,
            args: [id, id]
        });
        const total_charged = Number((financialResult.rows[0] as any).total_charged);

        // 2. Total Paid (from payments linked to processes and services)
        const paymentsResult = await db.execute({
            sql: `
                SELECT 
                    COALESCE(SUM(value_paid), 0) as total_paid
                FROM payments
                WHERE (
                    (process_id IS NOT NULL AND process_id IN (
                        SELECT id FROM processes WHERE client_id = ? AND deleted_at IS NULL
                    ))
                    OR
                    (service_id IS NOT NULL AND service_id IN (
                        SELECT id FROM services WHERE client_id = ? AND deleted_at IS NULL
                    ))
                    OR
                    (client_id = ? AND process_id IS NULL AND service_id IS NULL)
                )
                AND status = 'Pago'
            `,
            args: [id, id, id]
        });
        const total_paid = Number((paymentsResult.rows[0] as any).total_paid);

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
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
