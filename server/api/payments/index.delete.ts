import { getUser } from "~~/server/util/auth";
import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id } = body;
    const user = await getUser(event);

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID is required",
        });
    }

    const result = await db.execute({
        sql: `
            SELECT process_id, service_id, client_id FROM financial_movements 
            WHERE id = ?
        `,
        args: [id]
    });

    const record = result.rows[0];


    if (!record) {
        throw createError({
            statusCode: 404,
            message: "Payment not found",
        });
    }



    let tableToCheck = "";
    let recordId = null;

    if (record.client_id) {
        tableToCheck = "clients";
        recordId = record.client_id;
    }
    if (record.process_id) {
        tableToCheck = "processes";
        recordId = record.process_id;
    }
    if (record.service_id) {
        tableToCheck = "services";
        recordId = record.service_id;
    }

    const checkResult = await db.execute({
        sql: `SELECT office_id FROM ${tableToCheck} WHERE id = ?`,
        args: [recordId]
    });

    const check = checkResult.rows[0];

    if (check?.office_id != user!.office_id) {
        throw createError({
            statusCode: 403,
            message: "You don't have permission to delete this payment",
        });
    }


    try {
        await db.execute({
            sql: `
                DELETE FROM financial_movements
                WHERE id = ?
            `,
            args: [id]
        });

        return {
            success: true,
            message: "Payment deleted successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});