import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
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
                statusMessage: "Not Found",
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

        // Get financial summary
        // 1. Total Charged (from processes)
        const financialResult = await db.execute({
            sql: `
                SELECT 
                    COALESCE(SUM(value_charged), 0) as total_charged
                FROM processes 
                WHERE client_id = ? AND deleted_at IS NULL
            `,
            args: [id]
        });
        const total_charged = Number((financialResult.rows[0] as any).total_charged);

        // 2. Total Paid (from payments linked to these processes)
        const paymentsResult = await db.execute({
            sql: `
                SELECT 
                    COALESCE(SUM(pnt.value_paid), 0) as total_paid
                FROM payments pnt
                JOIN processes p ON pnt.process_id = p.id
                WHERE p.client_id = ? AND p.deleted_at IS NULL AND pnt.status = 'Pago'
            `,
            args: [id]
        });
        const total_paid = Number((paymentsResult.rows[0] as any).total_paid);

        const balance = total_charged - total_paid;

        return {
            success: true,
            data: {
                ...client,
                processes,
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
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
