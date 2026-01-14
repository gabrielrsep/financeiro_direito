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
                c.name as client_name
            FROM processes p
            JOIN clients c ON p.client_id = c.id
        `;
        let countSql = `
            SELECT COUNT(*) as total 
            FROM processes p
            JOIN clients c ON p.client_id = c.id
        `;
        
        const params: any[] = [];
        const conditions: string[] = [];

        if (search) {
            conditions.push("(lower(p.process_number) LIKE ? OR lower(c.name) LIKE ?)");
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
