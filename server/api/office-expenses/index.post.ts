import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { description, amount, due_date, is_recurrent } = body;

    if (!description || !amount || !due_date) {
        throw createError({
            statusCode: 400,
            statusMessage: "Campos obrigatórios: descrição, valor e data de vencimento.",
        });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO office_expenses (description, amount, due_date, is_recurrent)
            VALUES (?, ?, ?, ?)
        `);
        
        const result = stmt.run(description, amount, due_date, is_recurrent ? 1 : 0);

        return {
            success: true,
            id: result.lastInsertRowid
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
