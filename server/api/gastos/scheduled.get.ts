import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const month = query.month ? parseInt(query.month as string) : new Date().getMonth() + 1;
    const year = query.year ? parseInt(query.year as string) : new Date().getFullYear();
    const search = (query.search as string || '').toLowerCase();

    // Format month for SQL (must be 2 digits)
    const formattedMonth = month < 10 ? `0${month}` : `${month}`;

    const all = query.all === 'true';

    try {
        let sql = `
            SELECT 
                pa.id as payment_id,
                pa.value_paid as value_due,
                pa.due_date,
                pa.status as payment_status,
                p.id as process_id,
                p.process_number,
                c.id as client_id,
                c.name as client_name
            FROM payments pa
            JOIN processes p ON pa.process_id = p.id
            JOIN clients c ON p.client_id = c.id
            WHERE pa.status = 'Pendente'
        `;
        
        const params: any[] = [];

        if (!all) {
            sql += " AND strftime('%m', pa.due_date) = ? AND strftime('%Y', pa.due_date) = ?";
            params.push(formattedMonth, year.toString());
        }

        if (search) {
            sql += " AND (lower(p.process_number) LIKE ? OR lower(c.name) LIKE ?)";
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam);
        }

        sql += " ORDER BY pa.due_date ASC";

        const result = await db.execute({
            sql,
            args: params
        });
        const scheduledPayments = result.rows;

        return {
            success: true,
            data: scheduledPayments,
            filters: {
                month,
                year
            }
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
