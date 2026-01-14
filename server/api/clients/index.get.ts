import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const sortBy = (query.sortBy as string) || 'created_at-desc';
    const offset = (page - 1) * limit;

    try {
        let sql = "SELECT * FROM clients";
        let countSql = "SELECT COUNT(*) as total FROM clients";
        const params: any[] = [];

        if (search) {
            const searchCondition = " WHERE lower(name) LIKE ? OR replace(document, '.', '') LIKE ?";
            sql += searchCondition;
            countSql += searchCondition;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam);
        }

        // Sorting mapping
        let orderBy = "created_at DESC";
        if (sortBy === 'name-asc') orderBy = "name ASC";
        else if (sortBy === 'name-desc') orderBy = "name DESC";
        else if (sortBy === 'created_at-asc') orderBy = "created_at ASC";
        else if (sortBy === 'created_at-desc') orderBy = "created_at DESC";

        sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        
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
        const clients = dataResult.rows;

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: clients,
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

// Helper function to handle possible quote changes if needed, 
// strictly for SQLite I'll stick to standard LIKE. 
// Note: 'change_quote' is not a standard SQLite function, I used it conceptually. 
// Let's stick to standard SQL. 
