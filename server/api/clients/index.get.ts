import { neonClient, replaceQuestionMarks } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toUpperCase();
    const sortBy = (query.sortBy as string) || 'created_at-desc';
    const offset = (page - 1) * limit;

    const { user } = await getUserSession(event)
    const officeId = user?.office_id;

    // Trata inicio e fim do mês diretamente em formato YYYY-MM-DD HH:mm:ss sem distorção de ISO
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Primeiro dia do mês às 00:00:00
    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01 00:00:00`;
    // Último dia do mês às 23:59:59
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;
    

    try {
        const recurrent = query.recurrent === 'true';
        
        let sql = `
        SELECT
            c.*,
            c.recurrence_value - COALESCE(SUM(fm.amount), 0) recurrence_paid
        FROM
            clients c
        LEFT JOIN financial_movements fm ON
            c.id = fm.client_id
            AND fm.type = 'payment'
            AND fm.movement_date BETWEEN ? AND ? 
        `;

        let countSql = "SELECT COUNT(*) as total FROM clients c";

        const sqlParams: any[] = [ startOfMonth, endOfMonth, officeId ];
        const countParams: any[] = [ officeId ];

        const whereConditions: string[] = ['c.office_id = ?', 'c.deleted_at IS NULL'];

        if (search) {
            whereConditions.push("(UPPER(c.name) LIKE ? OR replace(document, '.', '') LIKE ?)");
            const searchParam = `%${search}%`;
            sqlParams.push(searchParam, searchParam);
            countParams.push(searchParam, searchParam)
            
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
        
        sqlParams.push(limit, offset)

        // Count total
        const totalResult = await neonClient.query(replaceQuestionMarks(countSql), countParams);
        const total = totalResult[0] ? Number(totalResult[0].total) : 0;

        // Get data
        const clients = await neonClient.query(replaceQuestionMarks(sql), sqlParams);

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