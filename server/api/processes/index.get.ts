import { db } from "../../database/connection";

export default defineEventHandler((event) => {
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
        const countStmt = db.prepare(countSql);
        const totalResult = search ? countStmt.get(...params) : countStmt.get();
        const total = totalResult ? (totalResult as any).total : 0;

        // Get data
        const stmt = db.prepare(sql);
        const processes = stmt.all(...params, limit, offset);

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
