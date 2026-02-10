
import { db, databaseArgs } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, document, contact, address, is_recurrent, recurrence_value, recurrence_day } = body;

    if (!name || !document) {
        throw createError({
            statusCode: 400,
            message: "Name and Document are required",
        });
    }

    // Validação: Cliente recorrente deve ter data de pagamento e valor
    if (is_recurrent && (!recurrence_day || !recurrence_value)) {
        throw createError({
            statusCode: 400,
            message: "Payment date (recurrence_day) and monthly value (recurrence_value) are required for recurrent clients",
        });
    }

    try {
        const result = await db.execute({
            sql: `INSERT INTO clients (name, document, contact, address, is_recurrent, recurrence_value, recurrence_day) 
                  VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            args: databaseArgs(name, document, contact, address, is_recurrent ? 1 : 0, recurrence_value, recurrence_day)
        });
        
        const row = result.rows[0];

        return {
            success: true,
            data: {
                id: Number(row.id),
                name,
                document,
                contact,
                address,
                is_recurrent,
                recurrence_value,
                recurrence_day,
            },
        };
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: "Client with this document already exists",
            });
        }
        throw createError({
            statusCode: 500,
            message: error.message,
        });

    }
});
