import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const startDate = query.startDate as string;
    const endDate = query.endDate as string;
    const clientId = query.clientId as string;
    const status = query.status as string;

    try {
        let baseSql = `
            FROM payments p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN processes pr ON p.process_id = pr.id
        `;
        let whereConditions: string[] = [];
        let params: any[] = [];

        if (startDate) {
            whereConditions.push("p.payment_date >= ?");
            params.push(startDate);
        }
        if (endDate) {
            whereConditions.push("p.payment_date <= ?");
            // Append end of day time if only date is provided
            if (endDate.length === 10) {
                 params.push(endDate + ' 23:59:59');
            } else {
                 params.push(endDate);
            }
        }
        if (clientId) {
            whereConditions.push("p.client_id = ?");
            params.push(clientId);
        }
        if (status) {
            whereConditions.push("p.status = ?");
            params.push(status);
        }
        
        let whereClause = "";
        if (whereConditions.length > 0) {
            whereClause = " WHERE " + whereConditions.join(" AND ");
        }

        const countSql = `SELECT COUNT(*) as total ${baseSql} ${whereClause}`;
        const dataSql = `
            SELECT 
                p.*,
                c.name as client_name,
                pr.process_number
            ${baseSql} 
            ${whereClause}
            ORDER BY p.due_date DESC, p.payment_date DESC
            LIMIT ? OFFSET ?
        `;

        // Execute count
        const countResult = await db.execute({
            sql: countSql,
            args: params
        });
        const total = countResult.rows[0] ? Number(countResult.rows[0].total) : 0;

        // Execute data
        const dataResult = await db.execute({
            sql: dataSql,
            args: [...params, limit, offset]
        });
        const payments = dataResult.rows;

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: payments,
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
