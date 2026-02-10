import { db } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id")
    const body = await readBody(event)
    const { payment_method: newPaymentMethod, ...updateData } = body

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "ID do processo é obrigatório",
        })
    }

    try {
        // Buscar método de pagamento atual
        const processResult = await db.execute({
            sql: "SELECT payment_method FROM processes WHERE id = ?",
            args: [id],
        })

        if (!processResult.rows.length) {
            throw createError({
                statusCode: 404,
                statusMessage: "Processo não encontrado",
            })
        }

        const currentPaymentMethod = processResult.rows[0].payment_method

        // Validar trocar método de pagamento
        if (newPaymentMethod && newPaymentMethod !== currentPaymentMethod) {
            throw createError({
                statusCode: 403,
                statusMessage: "Não é permitido alterar o método de pagamento após a criação do processo. Para mudanças, exclua e recrie o processo.",
                data: {
                    currentPaymentMethod,
                    attemptedPaymentMethod: newPaymentMethod
                }
            })
        }

        // Atualizar processo (sem alterar payment_method)
        const setClause = Object.keys(updateData)
            .filter(key => key !== 'payment_method' && key !== 'id')
            .map(key => `${key} = ?`)
            .join(', ')

        const values = Object.keys(updateData)
            .filter(key => key !== 'payment_method' && key !== 'id')
            .map(key => updateData[key])

        if (setClause) {
            await db.execute({
                sql: `UPDATE processes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                args: [...values, id],
            })
        }

        // Buscar processo atualizado para retorno
        const updatedResult = await db.execute({
            sql: `SELECT p.*, c.name as client_name FROM processes p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?`,
            args: [id],
        })

        const updatedProcess = updatedResult.rows[0] || null

        return { success: true, message: "Processo atualizado com sucesso", data: updatedProcess }
    } catch (error) {
        console.error("Erro ao atualizar processo:", error)
        throw error
    }
})
