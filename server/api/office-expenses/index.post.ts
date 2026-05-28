import { getUser } from "~~/server/util/auth";
import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { description, amount, due_date, is_recurrent } = body;

    const user = await getUser(event);

    if (!description || !amount || !due_date) {
        throw createError({
            statusCode: 400,
            message: "Campos obrigatórios: descrição, valor e data de vencimento.",
        });
    }

    try {
        const result = await db.execute({
            sql: `
                INSERT INTO office_expenses (office_id, description, amount, due_date, is_recurrent)
                VALUES (?, ?, ?, ?, ?)
            `,
            args: [user!.office_id, description, amount, due_date, is_recurrent ? 1 : 0]
        });

        return {
            success: true,
            id: Number(result.lastInsertRowid)
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});
