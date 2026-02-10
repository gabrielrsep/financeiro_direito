import { databaseArgs, db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const { 
        client_id, 
        description, 
        value_charged, 
        payment_method,
        em_conta_details,
        installments
    } = await readBody(event);

    if (!client_id || !description) {
        throw createError({
            statusCode: 400,
            message: "Client ID and Description are required",
        });
    }

    try {
        const tx = await db.transaction("write");
        try {
            const result = await tx.execute({
                sql: `
                    INSERT INTO services (client_id, description, value_charged, payment_method, status)
                    VALUES (?, ?, ?, ?, ?)
                `,
                args: databaseArgs(
                    client_id, 
                    description, 
                    value_charged || 0, 
                    payment_method, 
                    'Ativo'
                )
            });
            
            const serviceId = Number(result.lastInsertRowid);

            // Handle installments if payment method is 'em_conta'
            if (payment_method === 'em_conta' && installments) {
                const { count, down_payment, first_due_date } = installments;
                
                // Handle down payment if exists
                if (down_payment > 0) {
                    await tx.execute({
                        sql: `
                            INSERT INTO payments (service_id, client_id, value_paid, payment_date, status)
                            VALUES (?, ?, ?, ?, ?)
                        `,
                        args: [serviceId, client_id, down_payment, new Date().toISOString(), 'Pago']
                    });
                }

                // Create installments
                const installmentValue = (value_charged - (down_payment || 0)) / count;
                const startDate = new Date(first_due_date || new Date());

                for (let i = 0; i < count; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(startDate.getMonth() + i);
                    
                    await tx.execute({
                        sql: `
                            INSERT INTO payments (service_id, client_id, value_paid, due_date, status)
                            VALUES (?, ?, ?, ?, ?)
                        `,
                        args: [serviceId, client_id, installmentValue, dueDate.toISOString(), 'Pendente']
                    });
                }

                const emContaDetails = `${value_charged}+${count}x${installmentValue}`;
                await tx.execute({
                    sql: `
                        UPDATE services 
                        SET em_conta_details = ?
                        WHERE id = ?
                    `,
                    args: [emContaDetails, serviceId]
                });
            }

            await tx.commit();

            return {
                success: true,
                data: {
                    id: serviceId,
                    client_id,
                    description,
                    value_charged,
                    payment_method,
                    status: 'Ativo'
                }
            };
        } catch (error: any) {
            await tx.rollback();
            throw error;
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
