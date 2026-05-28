
import { db, databaseArgs } from "~~/server/database/connection";
import { getUser } from "~~/server/util/auth";
import { devLogger } from "~~/server/util/logger";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, document, contact, address, is_recurrent, recurrence_value, recurrence_day } = body;

    const user = await getUser(event);


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
        const trx = await db.transaction()
        const result = await trx.execute({
            sql: `INSERT INTO clients (office_id, name, document, contact, address, is_recurrent, recurrence_value, recurrence_day) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: databaseArgs(user!.office_id, name, document, contact, address, is_recurrent ? 1 : 0, recurrence_value, recurrence_day)
        });
        
        const clientId = result.lastInsertRowid;

        await trx.commit();
        

        return {
            success: true,
            data: {
                id: Number(clientId),
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
        devLogger.error("Error creating client:", error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });

    }
});
