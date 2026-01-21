import { databaseArgs, db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const { 
        client_id, 
        process_number, 
        tribunal, 
        description, 
        status, 
        value_charged, 
        payment_method,
        target,
        installments // { count: number, down_payment: number, first_due_date: string }
    } = await readBody(event);

    if (!client_id || !process_number) {
        throw createError({
            statusCode: 400,
            message: "Client ID and Process Number are required",
        });
    }

    try {
        const tx = await db.transaction("write");
        try {
            const result = await tx.execute({
                sql: `
                    INSERT INTO processes (client_id, process_number, tribunal, description, status, value_charged, payment_method, target)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: databaseArgs(
                    client_id, 
                    process_number, 
                    tribunal, 
                    description,
                    status || 'Ativo', 
                    value_charged || 0, 
                    payment_method, 
                    target
                )
            });
            
            const processId = Number(result.lastInsertRowid);

            // Handle installments if payment method is 'em_conta'
            if (payment_method === 'em_conta' && installments) {
                const { count, down_payment, first_due_date } = installments;
                
                // 1. Handle down payment if exists
                if (down_payment > 0) {
                    await tx.execute({
                        sql: `
                            INSERT INTO payments (process_id, value_paid, payment_date, status)
                            VALUES (?, ?, ?, ?)
                        `,
                        args: [processId, down_payment, new Date().toISOString(), 'Pago']
                    });
                }

                // 2. Create installments
                const installmentValue = (value_charged - (down_payment || 0)) / count;
                const startDate = new Date(first_due_date || new Date());

                for (let i = 0; i < count; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(startDate.getMonth() + i);
                    
                    await tx.execute({
                        sql: `
                            INSERT INTO payments (process_id, value_paid, due_date, status)
                            VALUES (?, ?, ?, ?)
                        `,
                        args: [processId, installmentValue, dueDate.toISOString(), 'Pendente']
                    });
                }
            }

            await tx.commit();

            return {
                success: true,
                data: {
                    id: processId,
                    client_id,
                    process_number,
                    tribunal,
                    description,
                    status,
                    value_charged,
                    payment_method
                },
            };
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: "Process with this number already exists",
            });
        }
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }
});
