import { neonClient, replaceQuestionMarks } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const offset = (page - 1) * limit;

    try {
        let sql = `
            SELECT *
            FROM office_expenses
            WHERE deleted_at IS NULL
        `;
        let countSql = `
            SELECT COUNT(*) as total 
            FROM office_expenses
            WHERE deleted_at IS NULL
        `;
        
        const params: any[] = [];

        if (search) {
            const searchCondition = " AND (lower(description) LIKE ?)";
            sql += searchCondition;
            countSql += searchCondition;
            const searchParam = `%${search}%`;
            params.push(searchParam);
        }

        sql += " ORDER BY is_recurrent DESC, CASE WHEN status = 'Pendente' THEN 0 ELSE 1 END, due_date ASC LIMIT ? OFFSET ?";

        // Count total
        const totalResult = await neonClient.query(replaceQuestionMarks(countSql), params);

        const total = totalResult[0] ? Number(totalResult[0].total) : 0;

        // Get data
        const dataResult = await neonClient.query(replaceQuestionMarks(sql), [...params, limit, offset]);
        const expenses = dataResult;

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: expenses,
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
