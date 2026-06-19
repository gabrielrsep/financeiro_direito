import { Pool } from "@neondatabase/serverless";
import { repeatParms } from "../../database/connection";
import { insertMoviments } from "~~/server/util/installments";

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
        installments
    } = await readBody(event);

    const { user } = await getUserSession(event)

    if (!client_id || !process_number) {
        throw createError({
            statusCode: 400,
            message: "Client ID and Process Number are required",
        });
    }

    let _ex: any

    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const connection = await pool.connect()

    try {
        await connection.query('BEGIN');

        const result = await connection.query(`
            INSERT INTO processes (
                user_id,
                client_id,
                office_id,
                process_number,
                tribunal,
                description,
                status,
                value_charged,
                payment_method,
                target
            ) VALUES (${repeatParms(10)})
            RETURNING id
        `, [user?.id, client_id, user?.office_id, process_number, tribunal, description, status || 'Ativo', value_charged || 0, payment_method, target])
            
        const processId = Number(result.rows[0]?.id);

        await insertMoviments(connection, processId, value_charged, user!, installments)

        await connection.query('COMMIT')

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
    } catch (error: any) {
        await connection.query('ROLLBACK')
        _ex = error
    } finally {
        connection.release()
        await pool.end()
    }

    if(_ex) {
        throw createError({
            status: 500,
            message: _ex.message,
            statusMessage: _ex.message
        });
    }
});
