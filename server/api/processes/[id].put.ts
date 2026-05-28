import { db } from "~~/server/database/connection";
import { getUser } from "~~/server/util/auth";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id")
    const body = await readBody(event)

    const user = await getUser(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "ID do processo é obrigatório",
        })
    }

    try {
        // Buscar método de pagamento atual
        const processResult = await db.execute({
            sql: "SELECT * FROM processes WHERE id = ?",
            args: [id],
        })

        if (!processResult.rows.length) {
            throw createError({
                statusCode: 404,
                statusMessage: "Processo não encontrado",
            })
        }

        const process = processResult.rows[0]

        if(process!.office_id !== user!.office_id) {
            throw createError({
                statusCode: 403,
                statusMessage: "Você não tem permissão para atualizar este processo",
            })
        }

        const filterKeys = (key: unknown) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(key as string)

        // Atualizar processo (sem alterar payment_method)
        const setClause = Object.keys(body)
            .filter(filterKeys)
            .map(key => `${key} = ?`)
            .join(', ')

        const values: any[] = Object.values(body)
            .filter(filterKeys)

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
    } catch (error: unknown) {
        throw createError({
            statusCode: 500,
            message: (error as Error).message,
        })
    }
})
