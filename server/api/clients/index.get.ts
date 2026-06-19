import { neonClient, replaceQuestionMarks } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const sortBy = (query.sortBy as string) || 'created_at-desc';
    const offset = (page - 1) * limit;

    const { user } = await getUserSession(event)
    const officeId = user?.office_id;

    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const currentMonthStartStr = currentMonthStart.toISOString();
    const currentMonthEndStr = currentMonthEnd.toISOString();

    try {
        const recurrent = query.recurrent === 'true';
        
        let sql = `
        SELECT
            c.*,
            c.recurrence_value - COALESCE( SUM(fm.amount), 0) recurrence_paid
        FROM
            clients c
        LEFT JOIN financial_movements fm ON
            c.id = fm.client_id
            AND fm.type = 'payment'
            AND fm.movement_date BETWEEN '${currentMonthStartStr}' AND '${currentMonthEndStr}' 
        `;
        let countSql = "SELECT COUNT(*) as total FROM clients c";
        const params: any[] = [ officeId ];
        const whereConditions: string[] = ['c.office_id = ?'];

        if (search) {
            whereConditions.push("(name LIKE ? OR replace(document, '.', '') LIKE ?)");
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam);
        }

        if (recurrent) {
            whereConditions.push("is_recurrent IS TRUE");
        }

        const whereClause = " WHERE " + whereConditions.join(" AND ");
        sql += whereClause;
        countSql += whereClause;

        // Sorting mapping
        let orderBy = "created_at DESC";
        if (sortBy === 'name-asc') orderBy = "name ASC";
        else if (sortBy === 'name-desc') orderBy = "name DESC";
        else if (sortBy === 'created_at-asc') orderBy = "created_at ASC";
        else if (sortBy === 'created_at-desc') orderBy = "created_at DESC";

        sql += ` GROUP BY c.id ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        
        // Count total
        const totalResult = await neonClient.query(replaceQuestionMarks(countSql), params);
        const total = totalResult[0] ? Number(totalResult[0].total) : 0;

        // Get data
        const clients = await neonClient.query(replaceQuestionMarks(sql), [...params, limit, offset]);

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
            status: 500,
            message: error.message,
        });
    }
});