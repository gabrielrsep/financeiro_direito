import { neonClient, replaceQuestionMarks } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const offset = (page - 1) * limit;

    const { user } = await getUserSession(event)

    try {
        let sql = `
            with totals as (
                select
                    fm.process_id,
                    sum(fm.amount) total_paid
                from
                    financial_movements fm
                where
                    fm."type" = 'payment'
                    and fm.process_id is not null
                group by
                    fm.process_id
                )
                select
                    p.*,
                    c."name" as client_name,
                    coalesce(t.total_paid, 0) as total_paid,
                    p.value_charged - coalesce(t.total_paid, 0) as total_pending,
                    coalesce(t.total_paid, 0) >= p.value_charged as is_fully_paid
                from
                    processes p
                left join totals t on
                    p.id = t.process_id
                join clients c on
                    c.id = p.client_id
        `;
        let countSql = `
            SELECT COUNT(*) as total 
            FROM processes p JOIN clients c ON p.client_id = c.id
        `;
        
        const params: any[] = [user!.office_id];
        const conditions: string[] = ['p.office_id = ?', 'p.deleted_at IS NULL', 'c.deleted_at IS NULL'];

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


        sql += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";

        // Count total
        const totalResult = await neonClient.query(replaceQuestionMarks(countSql), params);
        const total = totalResult[0] ? Number(totalResult[0].total) : 0;

        // Get data
        const processes = await neonClient.query(replaceQuestionMarks(sql), [...params, limit, offset]);

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
