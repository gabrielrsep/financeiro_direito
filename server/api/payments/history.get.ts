import { neonClient, replaceQuestionMarks } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    // paginação
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;


    const startDate = query.startDate as string;
    const endDate = query.endDate as string;
    const month = query.month as string
    const year = query.year as string

    const type = query.type as 'charge' | 'payment'



    const { user } = await getUserSession(event)!;
    const officeId = user!.office_id

    const whereConditions: string[] = [
        "fm.office_id = ?"
    ];
    const params: any[] = [officeId];

    if(!type || type !== 'charge' && type !== 'payment') {
        return createError({
            status: 400,
            message: "'type' parameter is required and only can be 'charge' or 'payment'"
        })
    }

    whereConditions.push("fm.type = ?")
    params.push(type)

    if(month && year) {
        const m = Number(month) < 10 ? '0' + month : month
        // Maior ou igual ao primeiro dia do mês corrente
        whereConditions.push("fm.movement_date >= make_date(?,?,1)");
        params.push(year.toString(), m);

        // Menor que o primeiro dia do próximo mês
        whereConditions.push("fm.movement_date < make_date(?,?,1) + interval '1 month'");
        params.push(year.toString(), m);
    } else if(month || year) {
        throw createError({
            status: 400,
            message: "you need to specify 'month' and 'year' parameter."
        })
    } else {
        if (startDate) {
            whereConditions.push("fm.movement_date >= ?");
            params.push(startDate);
        }
        if (endDate) {
            whereConditions.push("fm.movement_date <= ?");
            params.push(endDate.length === 10 ? `${endDate} 23:59:59` : endDate);
        }
    }

    if (query.clientId) {
        whereConditions.push("fm.client_id = ?");
        params.push(query.clientId);
    } else if(query.processId) {
        whereConditions.push("fm.process_id = ?");
        params.push(query.processId);
    } else if(query.serviceId) {
        whereConditions.push("fm.service_id = ?");
        params.push(query.serviceId);
    }

    let whereClause = ''
    if(whereConditions.length > 0) {
        whereClause += " WHERE " + whereConditions.join(" AND ")
    }

    try {

        const countSql = `
            SELECT COUNT(*) as total 
            FROM financial_movements fm
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

        const countResult = await neonClient.query(replaceQuestionMarks(countSql), params)
        
        const total = countResult[0] ? Number(countResult[0].total) : 0;

        const payments = await neonClient.query(replaceQuestionMarks(dataSql), [...params, limit, offset]);

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
