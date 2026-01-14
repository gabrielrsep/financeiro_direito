import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
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
    } = body;

    if (!client_id || !process_number) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Client ID and Process Number are required",
        });
    }

    try {
        const result = db.transaction(() => {
            const stmt = db.prepare(`
                INSERT INTO processes (client_id, process_number, tribunal, description, status, value_charged, payment_method, target)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const info = stmt.run(client_id, process_number, tribunal, description, status || 'Ativo', value_charged || 0, payment_method, target);
            const processId = info.lastInsertRowid;

            // Handle installments if payment method is 'em_conta'
            if (payment_method === 'em_conta' && installments) {
                const { count, down_payment, first_due_date } = installments;
                
                // 1. Handle down payment if exists
                if (down_payment > 0) {
                    const stmtDownPayment = db.prepare(`
                        INSERT INTO payments (process_id, value_paid, payment_date, status)
                        VALUES (?, ?, ?, ?)
                    `);
                    stmtDownPayment.run(processId, down_payment, new Date().toISOString(), 'Pago');
                }

                // 2. Create installments
                const installmentValue = (value_charged - (down_payment || 0)) / count;
                const startDate = new Date(first_due_date || new Date());

                const stmtInstallment = db.prepare(`
                    INSERT INTO payments (process_id, value_paid, due_date, status)
                    VALUES (?, ?, ?, ?)
                `);

                for (let i = 0; i < count; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(startDate.getMonth() + i);
                    
                    stmtInstallment.run(processId, installmentValue, dueDate.toISOString(), 'Pendente');
                }
            }

            return processId;
        })();

        return {
            success: true,
            data: {
                id: result,
                client_id,
                process_number,
                tribunal,
                description,
                status,
                value_charged,
                payment_method
            },
        };
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw createError({
                statusCode: 409,
                statusMessage: "Conflict",
                message: "Process with this number already exists",
            });
        }
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
