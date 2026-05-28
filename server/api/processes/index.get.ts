import { db } from "../../database/connection";
import { isFullyPaid } from "../../util/payment";

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
                SUM(fm.amount) AS total_paid,
                c.name AS client_name
            FROM
                processes p
            LEFT JOIN financial_movements fm ON
                fm.process_id = p.id
                AND fm."type" = 'payment'
            JOIN clients c ON p.client_id = c.id
        `;
        let countSql = `
            SELECT COUNT(*) as total 
            FROM processes p JOIN clients c ON p.client_id = c.id
        `;
        
        const params: string[] = [];
        const conditions: string[] = ['p.deleted_at IS NULL', 'c.deleted_at IS NULL'];

        if (search) {
            conditions.push("(p.process_number LIKE ? OR c.name LIKE ?)");
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam);
        }

        if (query.showArchived !== 'true') {
            conditions.push("p.status != 'Arquivado'");
        }

        if (conditions.length > 0) {
            const whereClause = " WHERE " + conditions.join(" AND ");
            sql += whereClause;
            countSql += whereClause;
        }


        sql += " GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?";

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

        

        const processes = dataResult.rows.map((process: any) => ({
            ...process,
            is_fully_paid: isFullyPaid(Number(process.value_charged), Number(process.total_paid))
        }));

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
            message: error.message,
        });
    }
});
