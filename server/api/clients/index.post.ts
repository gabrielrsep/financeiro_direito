
import { neonClient } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, document, contact, address, is_recurrent, recurrence_value, recurrence_day } = body;

    const { user } = await getUserSession(event);


    if (!name || !document) {
        throw createError({
            statusCode: 400,
            message: "Name and Document are required",
        });
    }

    // Validação: Cliente recorrente deve ter data de pagamento e valor
    if (is_recurrent && (!recurrence_day || !recurrence_value)) {
        throw createError({
            statusCode: 400,
            message: "Payment date (recurrence_day) and monthly value (recurrence_value) are required for recurrent clients",
        });
    }

    try {
        const result = await neonClient
        `INSERT INTO clients (office_id, name, document, contact, address, is_recurrent, recurrence_value, recurrence_day) 
                VALUES (${user!.office_id}, ${name}, ${document}, ${contact}, ${address}, ${is_recurrent ? 1 : 0}, ${recurrence_value}, ${recurrence_day})
        RETURNING id`

        const clientId = result[0]?.id;

        

        return {
            success: true,
            data: {
                id: Number(clientId),
                name,
                document,
                contact,
                address,
                is_recurrent,
                recurrence_value,
                recurrence_day,
            },
        };
    } catch (error: any) {
        throw createError({
            status: 500,
            message: error.message,
            statusMessage: error.message
        });

    }
});
