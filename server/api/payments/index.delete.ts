import { db } from "../../database/connection";
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
    const { id } = body;

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Bad Request",
            message: "ID is required",
        });
    }

    try {
        await db.execute({
            sql: `
                DELETE FROM payments
                WHERE id = ?
            `,
            args: [id]
        });

        return {
            success: true,
            message: "Payment deleted successfully",
        };
    } catch (error: any) {
        logger.error(error.message);
        throw createError({
            statusCode: 500,
            message: "Internal Server Error",
            message: error.message,
        });
    }
});