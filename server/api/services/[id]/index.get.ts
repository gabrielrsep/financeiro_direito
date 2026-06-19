import { neonClient as sql } from "~~/server/database/connection";
import { isFullyPaid } from "~~/server/util/payment";

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
        const serviceResult = await sql`
            SELECT 
                s.*,
                c.name as client_name,
                c.document as client_document,
                c.contact as client_contact,
                c.address as client_address
            FROM services s
            LEFT JOIN clients c ON s.client_id = c.id
            WHERE s.id = ${id} AND s.deleted_at IS NULL
        `

        const service = serviceResult[0];

        if (!service) {
            throw createError({
                statusCode: 404,
                message: "Service not found",
            });
        }

        // Get payment history
        const paymentsResult = await sql`
            SELECT *, amount as value_paid, movement_date as payment_date
            FROM financial_movements
            WHERE service_id = ${id}
            ORDER BY movement_date DESC, created_at DESC
        `

        const totalPaidResult = await sql`
            SELECT
                SUM(amount) as total
            FROM financial_movements
            WHERE service_id = ${id} AND "type" = 'payment'
        `

        const payments = paymentsResult || [];

        const totalPaid = totalPaidResult[0] ? Number(totalPaidResult[0].total) : 0;
        const totalPending = Number(service.value_charged) - totalPaid;


        return {
            success: true,
            data: {
                ...service,
                is_fully_paid: isFullyPaid(Number(service.value_charged), totalPaid),
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
