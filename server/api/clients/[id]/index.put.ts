import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const { name, document, contact, address, is_recurrent, recurrence_value, recurrence_day } = body;

    if (!id || !name || !document) {
        throw createError({
            statusCode: 400,
            message: "Client ID, name, and document are required",
        });
    }

    const { user } = await getUserSession(event)


    const clientsQuery = await sql`SELECT office_id FROM clients WHERE id = ${id}`

    if(clientsQuery.length === 0) {
        throw createError({
            status: 404,
            message: 'Client not found'
        })
    }

    const dbClient = clientsQuery[0]

    if(user?.office_id && user.office_id != dbClient!.office_id) {
        throw createError({
            status: 401,
            message: "You dont have permission to edit this client",
        })
    }

    // Validação: Cliente recorrente deve ter data de pagamento e valor
    if (is_recurrent && (!recurrence_day || !recurrence_value)) {
        throw createError({
            status: 400,
            message: "Payment date (recurrence_day) and monthly value (recurrence_value) are required for recurrent clients",
        })
    }

    try {
        const updateResult = await sql`
            UPDATE clients
            SET name = ${name}, document = ${document}, contact = ${contact}, address = ${address}, is_recurrent = ${!!is_recurrent}, recurrence_value = ${recurrence_value}, recurrence_day = ${recurrence_day}
            WHERE id = ${id} AND deleted_at IS NULL RETURNING id
        `
        
        
        if (updateResult.length === 0) {
            throw createError({
                statusCode: 404,
                message: "Client not found",
            });
        }

        const client = await sql`SELECT * FROM clients WHERE id = ${id}`;

        return {
            success: true,
            message: "Client updated successfully",
            data: client[0]
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
