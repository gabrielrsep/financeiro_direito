import { db } from "~~/server/database/connection"

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id")
    const { value_paid, payment_date, status } = await readBody(event)

    if (!id || value_paid === undefined) {
        throw createError({
            statusCode: 400,
            statusMessage: "ID e Valor Pago são obrigatórios",
        })
    }

    try {

        // Buscar pagamento existente com created_at
        const paymentResult = await db.execute({
            sql: "SELECT created_at FROM payments WHERE id = ?",
            args: [id],
        })

        if (!paymentResult.rows.length) {
            throw createError({
                statusCode: 404,
                statusMessage: "Pagamento não encontrado",
            })
        }

        const createdAt = new Date(paymentResult.rows[0].created_at as string)
        const now = new Date()
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

        // Verificar se passou 24h
        if (hoursDiff > 24) {
            throw createError({
                statusCode: 403,
                statusMessage: "Não é possível editar pagamentos após 24 horas da criação",
            })
        }

        // Atualizar pagamento
        await db.execute({
            sql: `UPDATE payments 
                  SET value_paid = ?, payment_date = ?, status = ? 
                  WHERE id = ?`,
            args: [value_paid, payment_date, status || "Pago", id],
        })

        return { success: true, message: "Pagamento atualizado com sucesso" }
    } catch (error) {
        console.error("Erro ao atualizar pagamento:", error)
        throw error
    }
})
