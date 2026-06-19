import { neonClient as sql } from '~~/server/database/connection'

export default defineEventHandler(async (event) => {
    const { user } = await getUserSession(event);
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID is required",
        });
    }

    const result = await sql`SELECT office_id FROM financial_movements WHERE id = ${id}`;
    const record = result[0];

    if (!record) {
        throw createError({
            statusCode: 404,
            message: "Payment not found",
        });
    }

    if (user!.office_id && record!.office_id != user!.office_id) {
        throw createError({
            statusCode: 403,
            message: "You don't have permission to delete this payment",
        });
    }

    try {
        await sql`DELETE FROM financial_movements WHERE id = ${id}`;

        return {
            success: true,
            message: "Payment deleted successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});