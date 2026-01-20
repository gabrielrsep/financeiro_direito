import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { status, description, amount, due_date, is_recurrent } = body;

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID é obrigatório.",
        });
    }

    try {
        const tx = await db.transaction("write");
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
                    message: "Nenhum campo para atualizar.",
                });
            }

            // Get current data before update to handle recurrence logic
            const currentExpenseResult = await tx.execute({
                sql: "SELECT * FROM office_expenses WHERE id = ?",
                args: [id]
            });
            const currentExpense = currentExpenseResult.rows[0];

            if (!currentExpense) {
                throw createError({
                    statusCode: 404,
                    message: "Gasto não encontrado.",
                });
            }

            const sql = `UPDATE office_expenses SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
            params.push(id);

            await tx.execute({ sql, args: params });

            // Recurrence logic: if status changed to 'Pago' and is_recurrent is true
            const isNowPaid = status === 'Pago' && currentExpense.status !== 'Pago';
            const isRecurrent = is_recurrent !== undefined ? is_recurrent : currentExpense.is_recurrent;

            if (isNowPaid && isRecurrent) {
                const nextDueDate = new Date(String(currentExpense.due_date) + 'T00:00:00');
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

                await tx.execute({
                    sql: `
                        INSERT INTO office_expenses (description, amount, due_date, status, is_recurrent)
                        VALUES (?, ?, ?, 'Pendente', 1)
                    `,
                    args: [
                        description || currentExpense.description,
                        amount !== undefined ? amount : currentExpense.amount,
                        nextDueDateStr
                    ]
                });
            }

            await tx.commit();

            return {
                success: true
            };
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "Internal Server Error",
            message: error.message,
        });
    }
});
