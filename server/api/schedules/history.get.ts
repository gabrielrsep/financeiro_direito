import { db } from "~~/server/database/connection";
import { getUser } from "~~/server/util/auth";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const startDate = query.startDate as string;
    const endDate = query.endDate as string;
    const clientId = query.clientId as string;
    const month = query.month ? parseInt(query.month as string, 10) : undefined;
    const year = query.year ? parseInt(query.year as string, 10) : undefined;
    const formattedMonth = month !== undefined && !Number.isNaN(month) ? `${month < 10 ? '0' + month : month}` : undefined;

    const user = await getUser(event);

    try {
        let whereConditions: string[] = [
            "fm.type = 'charge'"
        ];
        let params: any[] = [];
        
        whereConditions.push("(p.office_id = ? OR c.office_id = ? OR s.office_id = ?)");
        params.push(user!.office_id, user!.office_id, user!.office_id);

        if (formattedMonth) {
            whereConditions.push("strftime('%m', fm.movement_date) = ?");
            params.push(formattedMonth);
        }
        if (year !== undefined && !Number.isNaN(year)) {
            whereConditions.push("strftime('%Y', fm.movement_date) = ?");
            params.push(year.toString());
        }

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
        
        const whereClause = whereConditions.length > 0 ? " WHERE " + whereConditions.join(" AND ") : "";

        const countSql = `
            SELECT COUNT(*) as total 
            FROM financial_movements fm
            LEFT JOIN processes p ON fm.process_id = p.id
            LEFT JOIN services s ON s.id = fm.service_id
            LEFT JOIN clients c ON fm.client_id = c.id
            ${whereClause}
        `;
        
        const dataSql = `
            SELECT 
                fm.id,
                fm.process_id,
                fm.service_id,
                fm.client_id,
                fm.type,
                fm.amount,
                fm.movement_date,
                fm.description,
                fm.created_at,  
                c.name as client_name,
                p.process_number,
                s.description as service_description
            FROM
                financial_movements fm
            LEFT JOIN processes p ON fm.process_id = p.id
            LEFT JOIN services s ON s.id = fm.service_id
            LEFT JOIN clients c ON fm.client_id = c.id
            ${whereClause}
            ORDER BY fm.movement_date DESC, fm.created_at DESC
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
        const schedules = dataResult.rows;

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: schedules,
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
