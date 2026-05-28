import { getUser } from "~~/server/util/auth";
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

    const { office_id: officeId } = await getUser(event)!;

    try {
        let whereConditions: string[] = [
            "fm.type = 'payment'",
            "(s.office_id = ? OR p.office_id = ? OR c.office_id = ?)"
        ];
        let params: any[] = [officeId, officeId, officeId];

        if (startDate) {
            whereConditions.push("fm.movement_date >= ?");
            params.push(startDate);
        }
        if (endDate) {
            whereConditions.push("fm.movement_date <= ?");
            if (endDate.length === 10) {
                 params.push(endDate + ' 23:59:59');
            } else {
                 params.push(endDate);
            }
        }
        if (clientId) {
            whereConditions.push("fm.client_id = ?");
            params.push(clientId);
        }
        if (status) {
            whereConditions.push("fm.status = ?");
            params.push(status);
        }
        
        const whereClause = whereConditions.length > 0 ? " WHERE " + whereConditions.join(" AND ") : "";

        const countSql = `
            SELECT COUNT(*) as total 
            FROM financial_movements fm
            LEFT JOIN services s ON s.id = fm.service_id
            LEFT JOIN processes p ON fm.process_id = p.id
            LEFT JOIN clients c ON fm.client_id = c.id
            ${whereClause}
        `;
        const dataSql = `
            SELECT 
                fm.*, 
                fm.amount as value_paid,
                fm.movement_date as payment_date,
                c.name as client_name,
                p.process_number,
                s.description as service_description
            FROM
                financial_movements fm
            LEFT JOIN services s ON s.id = fm.service_id
            LEFT JOIN processes p ON fm.process_id = p.id
            LEFT JOIN clients c ON fm.client_id = c.id
            ${whereClause}
            ORDER BY fm.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countResult = await db.execute({
            sql: countSql,
            args: params
        });
        const total = countResult.rows[0] ? Number(countResult.rows[0].total) : 0;

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
