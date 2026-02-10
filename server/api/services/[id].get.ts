import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Service ID is required",
        });
    }

    try {
        // Get service details with client info
        const serviceResult = await db.execute({
            sql: `
                SELECT 
                    s.*,
                    c.name as client_name,
                    c.document as client_document,
                    c.contact as client_contact,
                    c.address as client_address
                FROM services s
                LEFT JOIN clients c ON s.client_id = c.id
                WHERE s.id = ? AND s.deleted_at IS NULL
            `,
            args: [id]
        });

        const service = serviceResult.rows[0];

        if (!service) {
            throw createError({
                statusCode: 404,
                message: "Service not found",
            });
        }

        // Get payment history
        const paymentsResult = await db.execute({
            sql: `
                SELECT *
                FROM payments
                WHERE service_id = ?
                ORDER BY payment_date DESC, created_at DESC
            `,
            args: [id]
        });

        const payments = paymentsResult.rows || [];

        // Calculate totals
        const totalPaid = payments
            .filter((p: any) => p.status === 'Pago')
            .reduce((sum, p: any) => sum + (p.value_paid || 0), 0);

        const totalPending = payments
            .filter((p: any) => p.status === 'Pendente')
            .reduce((sum, p: any) => sum + (p.value_paid || 0), 0);

        return {
            success: true,
            data: {
                ...service,
                payments,
                summary: {
                    value_charged: Number(service.value_charged),
                    total_paid: totalPaid,
                    total_pending: totalPending,
                    balance: Number(service.value_charged) - totalPaid
                }
            }
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "Error fetching service details",
        });
    }
});
