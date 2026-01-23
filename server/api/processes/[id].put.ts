import { db, databaseArgs } from "../../database/connection";
import pino from "pino";

const logger = pino({
    transport: {
        target: 'pino-roll',
        options: {
            file: 'logs/error.log',
            frequency: 'daily',
            maxSize: '10MB',
            maxFiles: 7,
        },
    },
});

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { client_id, process_number, tribunal, target, description, status, value_charged, payment_method, add_to_client_account } = body;


    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID is required",
        });
    }

    try {
        const tx = await db.transaction("write");
        try {
            const checkResult = await tx.execute({
                sql: "SELECT id FROM processes WHERE id = ?",
                args: [id]
            });

            if (checkResult.rows.length === 0) {
                throw createError({
                    statusCode: 404,
                    message: "Process not found",
                });
            }

            await tx.execute({
                sql: `
                    UPDATE processes 
                    SET client_id = ?, 
                        process_number = ?, 
                        tribunal = ?, 
                        target = ?,
                        description = ?, 
                        status = ?, 
                        value_charged = ?,
                        payment_method = ?
                    WHERE id = ?
                `,
                args: databaseArgs(client_id, process_number, tribunal, target, description, status, value_charged, payment_method, id)
            });

            // Balance adjustment logic removed


            await tx.commit();

            return {
                success: true,
                data: {
                    id,
                    client_id,
                    process_number,
                    tribunal,
                    target,
                    description,
                    status,
                    value_charged,
                    payment_method,
                    add_to_client_account
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
        if (error.statusCode === 404) throw error;
        logger.error(error.message);
        throw createError({
            statusCode: 500,
            message: "Internal Server Error",
        });
    }
});
