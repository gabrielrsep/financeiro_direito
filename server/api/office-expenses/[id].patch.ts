import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { status, description, amount, due_date, is_recurrent } = body;

    try {
        const fields: string[] = [];
        const params: any[] = [];

        if (status !== undefined) {
            fields.push("status = ?");
            params.push(status);
        }
        if (description !== undefined) {
            fields.push("description = ?");
            params.push(description);
        }
        if (amount !== undefined) {
            fields.push("amount = ?");
            params.push(amount);
        }
        if (due_date !== undefined) {
            fields.push("due_date = ?");
            params.push(due_date);
        }
        if (is_recurrent !== undefined) {
            fields.push("is_recurrent = ?");
            params.push(is_recurrent ? 1 : 0);
        }

        if (fields.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: "Nenhum campo para atualizar.",
            });
        }

        // Get current data before update to handle recurrence logic
        const currentExpense = db.prepare("SELECT * FROM office_expenses WHERE id = ?").get(id) as any;

        if (!currentExpense) {
            throw createError({
                statusCode: 404,
                statusMessage: "Gasto não encontrado.",
            });
        }

        const sql = `UPDATE office_expenses SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
        params.push(id);

        const stmt = db.prepare(sql);
        stmt.run(...params);

        // Recurrence logic: if status changed to 'Pago' and is_recurrent is true
        const isNowPaid = status === 'Pago' && currentExpense.status !== 'Pago';
        const isRecurrent = is_recurrent !== undefined ? is_recurrent : currentExpense.is_recurrent;

        if (isNowPaid && isRecurrent) {
            const nextDueDate = new Date(currentExpense.due_date + 'T00:00:00');
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

            db.prepare(`
                INSERT INTO office_expenses (description, amount, due_date, status, is_recurrent)
                VALUES (?, ?, ?, 'Pendente', 1)
            `).run(
                description || currentExpense.description,
                amount !== undefined ? amount : currentExpense.amount,
                nextDueDateStr
            );
        }

        return {
            success: true
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || "Internal Server Error",
            message: error.message,
        });
    }
});
