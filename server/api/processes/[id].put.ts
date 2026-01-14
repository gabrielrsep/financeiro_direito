import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { client_id, process_number, tribunal, target, description, status, value_charged, payment_method, add_to_client_account } = body;

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "ID is required",
        });
    }

    try {
        const tx = await db.transaction("write");
        try {
            const checkResult = await tx.execute({
                sql: "SELECT id FROM processes WHERE id = ?",
                args: [id]
            });

            if (checkResult.rows.length === 0) {
                throw createError({
                    statusCode: 404,
                    statusMessage: "Not Found",
                    message: "Process not found",
                });
            }

            // Get old values to calculate balance adjustment
            const oldProcessResult = await tx.execute({
                sql: "SELECT value_charged, payment_method, client_id FROM processes WHERE id = ?",
                args: [id]
            });
            const oldProcess = oldProcessResult.rows[0] as any;

            await tx.execute({
                sql: `
                    UPDATE processes 
                    SET client_id = ?, 
                        process_number = ?, 
                        tribunal = ?, 
                        target = ?,
                        description = ?, 
                        status = ?, 
                        value_charged = ?,
                        payment_method = ?
                    WHERE id = ?
                `,
                args: [client_id, process_number, tribunal, target, description, status, value_charged, payment_method, id]
            });

            // Adjust client balance
            const handleBalanceAdjustment = async (pId: number, oldMethod: string, newMethod: string, oldClientId: number, newClientId: number, oldValue: number, newValue: number) => {
                const totalPaidResult = await tx.execute({
                    sql: "SELECT SUM(value_paid) as total FROM payments WHERE process_id = ?",
                    args: [pId]
                });
                const paidAmount = Number((totalPaidResult.rows[0] as any)?.total || 0);

                if (oldClientId !== newClientId) {
                    // Remove impact from old client
                    if (oldMethod === 'em_conta') {
                        const oldImpact = Number(oldValue) - paidAmount;
                        await tx.execute({
                            sql: "UPDATE clients SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            args: [oldImpact, oldClientId]
                        });
                    }
                    // Add impact to new client
                    if (newMethod === 'em_conta') {
                        await tx.execute({
                            sql: "UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            args: [newValue, newClientId]
                        });
                    }
                    // Delete payments if new method is not 'em_conta'
                    if (oldMethod === 'em_conta' && newMethod !== 'em_conta') {
                        await tx.execute({
                            sql: "DELETE FROM payments WHERE process_id = ?",
                            args: [pId]
                        });
                    }
                } else {
                    if (oldMethod === 'em_conta' && newMethod === 'em_conta') {
                        const delta = Number(newValue) - Number(oldValue);
                        if (delta !== 0) {
                            await tx.execute({
                                sql: "UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                                args: [delta, newClientId]
                            });
                        }
                    } else if (oldMethod !== 'em_conta' && newMethod === 'em_conta') {
                        await tx.execute({
                            sql: "UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            args: [newValue, newClientId]
                        });
                    } else if (oldMethod === 'em_conta' && newMethod !== 'em_conta') {
                        const impactToRemove = Number(oldValue) - paidAmount;
                        await tx.execute({
                            sql: "UPDATE clients SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            args: [impactToRemove, newClientId]
                        });
                        await tx.execute({
                            sql: "DELETE FROM payments WHERE process_id = ?",
                            args: [pId]
                        });
                    }
                }
            };

            await handleBalanceAdjustment(Number(id), oldProcess.payment_method, payment_method, oldProcess.client_id, client_id, oldProcess.value_charged, value_charged);

            await tx.commit();

            return {
                success: true,
                data: {
                    id,
                    client_id,
                    process_number,
                    tribunal,
                    target,
                    description,
                    status,
                    value_charged,
                    payment_method,
                    add_to_client_account
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
                statusMessage: "Conflict",
                message: "Process with this number already exists",
            });
        }
        if (error.statusCode === 404) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: error.message,
        });
    }
});
