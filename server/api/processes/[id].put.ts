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
        const checkStmt = db.prepare("SELECT id FROM processes WHERE id = ?");
        const exists = checkStmt.get(id);

        if (!exists) {
            throw createError({
                statusCode: 404,
                statusMessage: "Not Found",
                message: "Process not found",
            });
        }

        db.transaction(() => {
            // Get old values to calculate balance adjustment
            const oldProcessStmt = db.prepare("SELECT value_charged, payment_method, client_id FROM processes WHERE id = ?");
            const oldProcess = oldProcessStmt.get(id) as any;

            const stmt = db.prepare(`
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
            `);

            stmt.run(client_id, process_number, tribunal, target, description, status, value_charged, payment_method, id);

            // Adjust client balance
            const handleBalanceAdjustment = (pId: number, oldMethod: string, newMethod: string, oldClientId: number, newClientId: number, oldValue: number, newValue: number) => {
                const totalPaid = db.prepare("SELECT SUM(value_paid) as total FROM payments WHERE process_id = ?").get(pId) as any;
                const paidAmount = totalPaid?.total || 0;

                if (oldClientId !== newClientId) {
                    // Remove impact from old client
                    if (oldMethod === 'em_conta') {
                        const oldImpact = oldValue - paidAmount;
                        db.prepare("UPDATE clients SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(oldImpact, oldClientId);
                    }
                    // Add impact to new client
                    if (newMethod === 'em_conta') {
                        db.prepare("UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newValue, newClientId);
                    }
                    // Delete payments if new method is not 'em_conta'
                    if (oldMethod === 'em_conta' && newMethod !== 'em_conta') {
                        db.prepare("DELETE FROM payments WHERE process_id = ?").run(pId);
                    }
                } else {
                    if (oldMethod === 'em_conta' && newMethod === 'em_conta') {
                        const delta = newValue - oldValue;
                        if (delta !== 0) {
                            db.prepare("UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(delta, newClientId);
                        }
                    } else if (oldMethod !== 'em_conta' && newMethod === 'em_conta') {
                        db.prepare("UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newValue, newClientId);
                    } else if (oldMethod === 'em_conta' && newMethod !== 'em_conta') {
                        const impactToRemove = oldValue - paidAmount;
                        db.prepare("UPDATE clients SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(impactToRemove, newClientId);
                        db.prepare("DELETE FROM payments WHERE process_id = ?").run(pId);
                    }
                }
            };

            handleBalanceAdjustment(Number(id), oldProcess.payment_method, payment_method, oldProcess.client_id, client_id, oldProcess.value_charged, value_charged);
        })();

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
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
