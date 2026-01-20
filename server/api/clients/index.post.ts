
import { db, databaseArgs } from "~~/server/database/connection";
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
    const body = await readBody(event);
    const { name, document, contact, address, is_recurrent, recurrence_value, recurrence_day } = body;

    if (!name || !document) {
        throw createError({
            statusCode: 400,
            message: "Bad Request",
            message: "Name and Document are required",
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
                message: "Conflict",
                message: "Client with this document already exists",
            });
        }
        logger.error(error.message);
        throw createError({
            statusCode: 500,
            message: "Internal Server Error",
            message: error.message,
        });

    }
});
