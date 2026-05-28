import { getUser } from "~~/server/util/auth";
import { db } from "../../database/connection";
import { isFullyPaid } from "../../util/payment";

type ServiceWithPaymentInfo = {
    id: number;
    description: string;
    client_name: string;
    total_paid: number;
    total_pending: number;
    value_charged: number;
    is_fully_paid: boolean;
};

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const search = (query.search as string || '').toLowerCase();
    const clientId = query.clientId as string;
    const status = query.status as string;
    const offset = (page - 1) * limit;

        const { office_id: officeId } = await getUser(event)!;

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
        const dataResult: ServiceWithPaymentInfo[] = await db.execute({
            sql,
            args: [...params, limit, offset]
        }).then(res => res.rows);
        

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
