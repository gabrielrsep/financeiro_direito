import { getUser } from "~~/server/util/auth";
import { neonClient as sql } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { description, amount, due_date, is_recurrent } = body;

    const { user } = await getUserSession(event);

    if (!description || !amount || !due_date) {
        throw createError({
            statusCode: 400,
            message: "Campos obrigatórios: descrição, valor e data de vencimento.",
        });
    }

    try {
        const result = await sql`
                INSERT INTO office_expenses (office_id, description, amount, due_date, is_recurrent)
                VALUES (${user!.office_id}, ${description}, ${amount}, ${due_date}, ${!!is_recurrent}) RETURNING id
            `;

        return {
            success: true,
            id: Number(result[0]?.id)
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
