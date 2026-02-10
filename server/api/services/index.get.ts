import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const clientId = query.clientId as string;
    const status = query.status as string;
    const offset = (page - 1) * limit;

    try {
        let sql = `
            SELECT 
                s.*,
                c.name as client_name,
                (SELECT COALESCE(SUM(p.value_paid), 0) FROM payments p WHERE p.service_id = s.id AND p.status = 'Pago') as total_paid,
                s.value_charged - (SELECT COALESCE(SUM(p.value_paid), 0) FROM payments p WHERE p.service_id = s.id AND p.status = 'Pago') as total_pending
            FROM services s
            JOIN clients c ON s.client_id = c.id
        `;
        let countSql = `
            SELECT COUNT(*) as total 
            FROM services s
            JOIN clients c ON s.client_id = c.id
        `;
        
        const params: any[] = [];
        const conditions: string[] = [];

        if (search) {
            conditions.push("(s.description LIKE ? OR c.name LIKE ?)");
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam);
        }

        if (clientId) {
            conditions.push("s.client_id = ?");
            params.push(parseInt(clientId));
        }

        if (status && status !== 'all') {
            conditions.push("s.status = ?");
            params.push(status);
        }

        conditions.push("s.deleted_at IS NULL");

        if (conditions.length > 0) {
            const whereClause = " WHERE " + conditions.join(" AND ");
            sql += whereClause;
            countSql += whereClause;
        }

        sql += " ORDER BY s.updated_at DESC LIMIT ? OFFSET ?";

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
        const services = dataResult.rows;

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: services,
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
            message: error.message,
        });
    }
});
