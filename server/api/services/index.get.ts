import { getUser } from "~~/server/util/auth";
import { neonClient, replaceQuestionMarks } from "../../database/connection";
import { isFullyPaid } from "../../util/payment";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const clientId = query.clientId as string;
    const status = query.status as string;
    const offset = (page - 1) * limit;

    const { user } = await getUserSession(event);
    const officeId = user!.office_id

    try {
        let sql = `
            SELECT 
                s.*,
                c.name as client_name,
                (SELECT COALESCE(SUM(p.amount), 0) FROM financial_movements p WHERE p.service_id = s.id AND p.type = 'payment') as total_paid,
                s.value_charged - (SELECT COALESCE(SUM(p.amount), 0) FROM financial_movements p WHERE p.service_id = s.id AND p.type = 'payment') as total_pending
            FROM services s
            JOIN clients c ON s.client_id = c.id
        `;
        let countSql = `
            SELECT COUNT(*) as total 
            FROM services s
            JOIN clients c ON s.client_id = c.id
        `;
        
        const params: any[] = [officeId];
        const conditions: string[] = ['s.office_id = ?', 's.deleted_at IS NULL'];

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

        if (conditions.length > 0) {
            const whereClause = " WHERE " + conditions.join(" AND ");
            sql += whereClause;
            countSql += whereClause;
        }

        sql += " ORDER BY s.updated_at DESC LIMIT ? OFFSET ?";

        // Count total
        const totalResult = await neonClient.query(replaceQuestionMarks(countSql), params);
        const total = totalResult[0] ? Number(totalResult[0].total) : 0;

        // Get data
        const dataResult = await neonClient.query(replaceQuestionMarks(sql), [...params, limit, offset])
        

        for (const service of dataResult) {
            service.is_fully_paid = isFullyPaid(Number(service.value_charged), Number(service.total_paid));
        }

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: dataResult,
            meta: {
                total,
                page,
                limit,
                totalPages,
                
            }
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
