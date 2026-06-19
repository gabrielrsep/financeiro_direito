import { neonClient, replaceQuestionMarks } from "~~/server/database/connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const { description, value_charged, payment_method, status, em_conta_details } = await readBody(event);

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "Service ID is required",
        });
    }

    if (!description && !value_charged && !payment_method && !status && !em_conta_details) {
        throw createError({
            statusCode: 400,
            message: "At least one field to update is required",
        });
    }

    try {
        // Check if service exists
        const serviceResult = await neonClient`SELECT id FROM services WHERE id = ${id} AND deleted_at IS NULL`

        if (!serviceResult[0]) {
            throw createError({
                statusCode: 404,
                message: "Service not found",
            });
        }

        // Build update query dynamically
        const updates: string[] = [];
        const args: any[] = [];

        if (description !== undefined) {
            updates.push("description = ?");
            args.push(description);
        }
        if (value_charged !== undefined) {
            updates.push("value_charged = ?");
            args.push(value_charged);
        }
        if (payment_method !== undefined) {
            updates.push("payment_method = ?");
            args.push(payment_method);
        }
        if (status !== undefined) {
            updates.push("status = ?");
            args.push(status);
        }
        if (em_conta_details !== undefined) {
            updates.push("em_conta_details = ?");
            args.push(em_conta_details);
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: "No valid fields to update",
            });
        }

        args.push(id);

        const sql = `UPDATE services SET ${updates.join(", ")} WHERE id = ?`;

        await neonClient.query(replaceQuestionMarks(sql), args);

        return {
            success: true,
            message: "Service updated successfully"
        };
    } catch (error: any) {
        throw createError({
            status: error.statusCode || 500,
            message: error.message || "Error updating service",
        });
    }
});
