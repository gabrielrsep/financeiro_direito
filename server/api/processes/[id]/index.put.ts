import { replaceQuestionMarks, neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id")
    const body = await readBody(event)

    const { user } = await getUserSession(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "ID do processo é obrigatório",
        })
    }

    try {
        // Buscar método de pagamento atual
        const processResult = await sql`SELECT * FROM processes WHERE id = ${id}`

        if (!processResult.length) {
            throw createError({
                statusCode: 404,
                message: "Processo não encontrado",
            })
        }

        const process = processResult[0]

        if(process!.office_id !== user!.office_id) {
            throw createError({
                statusCode: 403,
                message: "Você não tem permissão para atualizar este processo",
            })
        }

        const filterKeys = (key: unknown) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(key as string)

        const setClause = Object.keys(body)
            .filter(filterKeys)
            .map(key => `${key} = ?`)
            .join(', ')

        const values: any[] = Object.values(body)
            .filter(filterKeys)

        if (setClause) {
            await sql.query(
                replaceQuestionMarks(`UPDATE processes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`),
                [...values, id]
            )
        }

        // Buscar processo atualizado para retorno
        const updatedResult = await sql`SELECT
            p.*,
            c.name as client_name
            FROM processes p
            LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ${id}
        `

        const updatedProcess = updatedResult[0] || null

        return { success: true, message: "Processo atualizado com sucesso", data: updatedProcess }
    } catch (error: unknown) {
        throw createError({
            statusCode: 500,
            message: (error as Error).message,
        })
    }
})
