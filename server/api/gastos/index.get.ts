import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const offset = (page - 1) * limit;

    try {
        let sql = `
            SELECT 
                p.*,
                c.name as client_name,
                COALESCE((SELECT SUM(value_paid) FROM payments WHERE process_id = p.id AND status = 'Pago'), 0) as total_paid
            FROM processes p
            JOIN clients c ON p.client_id = c.id
            WHERE p.payment_method = 'em_conta' AND p.status != 'finalizado'
        `;
        let countSql = `
            SELECT COUNT(*) as total 
            FROM processes p
            JOIN clients c ON p.client_id = c.id
            WHERE p.payment_method = 'em_conta' AND p.status != 'finalizado'
        `;
        
        const params: any[] = [];

        if (search) {
            const searchCondition = " AND (lower(p.process_number) LIKE ? OR lower(c.name) LIKE ?)";
            sql += searchCondition;
            countSql += searchCondition;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam);
        }

        sql += " ORDER BY p.updated_at DESC LIMIT ? OFFSET ?";

        // Count total
        const totalResult = await db.execute({
            sql: countSql,
            args: params
        });
        const total = totalResult.rows[0] ? Number(totalResult.rows[0].total) : 0;

        // Get data
        const dataResult = await db.execute({
            sql,
            args: [...params, limit, offset]
        });
        const processes = dataResult.rows;

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: processes,
            meta: {
                total,
                page,
                limit,
                totalPages
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
