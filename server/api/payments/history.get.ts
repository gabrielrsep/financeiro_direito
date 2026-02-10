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
        let whereConditions: string[] = [];
        let params: any[] = [];

        if (startDate) {
            whereConditions.push("pay.payment_date >= ?");
            params.push(startDate);
        }
        if (endDate) {
            whereConditions.push("pay.payment_date <= ?");
            // Append end of day time if only date is provided
            if (endDate.length === 10) {
                 params.push(endDate + ' 23:59:59');
            } else {
                 params.push(endDate);
            }
        }
        if (clientId) {
            whereConditions.push("pay.client_id = ?");
            params.push(clientId);
        }
        if (status) {
            whereConditions.push("pay.status = ?");
            params.push(status);
        }
        
        let whereClause = "";
        if (whereConditions.length > 0) {
            whereClause = " WHERE " + whereConditions.join(" AND ");
        }

        const countSql = `SELECT COUNT(*) as total FROM payments pay ${whereClause}`;
        const dataSql = `
            SELECT 
                pay.*,
                c.name as client_name,
                pro.process_number
            FROM
                payments pay
            JOIN processes pro ON
                pay.process_id = pro.id
            JOIN clients c ON pro.client_id = c.id OR c.is_recurrent = 1
            ${whereClause}
            ORDER BY pay.created_at DESC
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
