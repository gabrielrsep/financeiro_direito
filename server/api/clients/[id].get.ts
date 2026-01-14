import { db } from "../../database/connection";

export default defineEventHandler((event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Client ID is required",
        });
    }

    try {
        const clientStmt = db.prepare("SELECT * FROM clients WHERE id = ?");
        const client: any = clientStmt.get(id);

        if (!client) {
            throw createError({
                statusCode: 404,
                statusMessage: "Not Found",
                message: "Client not found",
            });
        }

        // Get processes for this client
        const processesStmt = db.prepare(`
            SELECT * FROM processes 
            WHERE client_id = ? AND deleted_at IS NULL 
            ORDER BY created_at DESC
        `);
        const processes = processesStmt.all(id);

        // Get financial summary
        // 1. Total Charged (from processes)
        const financialStmt = db.prepare(`
            SELECT 
                COALESCE(SUM(value_charged), 0) as total_charged
            FROM processes 
            WHERE client_id = ? AND deleted_at IS NULL
        `);
        const { total_charged } = financialStmt.get(id) as any;

        // 2. Total Paid (from payments linked to these processes)
        const paymentsStmt = db.prepare(`
            SELECT 
                COALESCE(SUM(pnt.value_paid), 0) as total_paid
            FROM payments pnt
            JOIN processes p ON pnt.process_id = p.id
            WHERE p.client_id = ? AND p.deleted_at IS NULL AND pnt.status = 'Pago'
        `);
        const { total_paid } = paymentsStmt.get(id) as any;

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
