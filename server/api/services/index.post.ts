import { Pool } from "@neondatabase/serverless";
import { repeatParms } from "../../database/connection";
import { insertMoviments } from "~~/server/util/installments";

export default defineEventHandler(async (event) => {
    const {
        client_id,
        description,
        value_charged,
        payment_method,
        installments
    } = await readBody(event);


    const { user } = await getUserSession(event);

    if (!client_id || !description) {
        throw createError({
            statusCode: 400,
            message: "Client ID and Description are required",
        });
    }

    if(installments && installments.value <= 0) {
        throw createError({
            message: "no instalment value"
        })
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const connection = await pool.connect()
    let ex_: any
    let insertedRow: any


    try {
        await connection.query('BEGIN');

        const result = await connection.query(`
            INSERT INTO services (user_id, client_id, office_id, description, value_charged, payment_method, status)
            VALUES(${repeatParms(7)}) RETURNING id
        `, [user!.id, client_id, user!.office_id, description, value_charged, payment_method, 'Ativo'])

        const { id } = result.rows[0]
        insertedRow = id

        await insertMoviments(connection, id, value_charged, user!, installments)

        await connection.query('COMMIT')
    } catch (ex: any) {
        ex_ = ex
        await connection.query('ROLLBACK')
    } finally {
        connection.release()
        await pool.end()
    }

    if (ex_) {
        return createError({
            status: 500,
            message: ex_.message
        })
    }

    return {
        success: true,
        data: {
            id: insertedRow,
            client_id,
            description,
            value_charged,
            payment_method,
            status: 'Ativo'
        }
    }
});


