import { getUser } from "~~/server/util/auth";
import { databaseArgs, db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const { 
        client_id, 
        process_number, 
        tribunal, 
        description, 
        status, 
        value_charged, 
        payment_method,
        target
    } = await readBody(event);

    const user = await getUser(event)

    if (!client_id || !process_number) {
        throw createError({
            statusCode: 400,
            message: "Client ID and Process Number are required",
        });
    }

    try {
        const tx = await db.transaction();
        try {
            const result = await tx.execute({
                sql: `
                    INSERT INTO processes (client_id, office_id, process_number, tribunal, description, status, value_charged, payment_method, target)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: databaseArgs(
                    client_id,
                    user!.office_id,
                    process_number, 
                    tribunal, 
                    description,
                    status || 'Ativo', 
                    value_charged || 0, 
                    payment_method, 
                    target
                )
            });
            
            const processId = Number(result.lastInsertRowid);

            

            await tx.commit();

            return {
                success: true,
                data: {
                    id: processId,
                    client_id,
                    process_number,
                    tribunal,
                    description,
                    status,
                    value_charged,
                    payment_method
                },
            };
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: "Process with this number already exists",
            });
        }
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});
