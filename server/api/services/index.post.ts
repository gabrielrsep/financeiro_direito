import { getUser } from "~~/server/util/auth";
import { databaseArgs, db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const {
        client_id,
        description,
        value_charged,
        payment_method
    } = await readBody(event);

    const user = await getUser(event);

    if (!client_id || !description) {
        throw createError({
            statusCode: 400,
            message: "Client ID and Description are required",
        });
    }

    try {
        const result = await db.execute({
            sql: `
                    INSERT INTO services (client_id, office_id, description, value_charged, payment_method, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                `,
            args: databaseArgs(
                client_id,
                user!.office_id,
                description,
                value_charged || 0,
                payment_method,
                'Ativo'
            )
        });

        return {
            success: true,
            data: {
                id: Number(result.lastInsertRowid),
                client_id,
                description,
                value_charged,
                payment_method,
                status: 'Ativo'
            }
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
