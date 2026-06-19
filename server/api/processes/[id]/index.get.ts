import { defineEventHandler, getRouterParam } from 'h3'
import { neonClient as sql } from '~~/server/database/connection'
import { isFullyPaid } from '~~/server/util/payment'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID do processo é obrigatório'
    })
  }
  const processResult = await sql`
    SELECT 
      p.*,
      c.name as client_name,
      c.document as client_document,
      c.contact as client_contact,
      c.address as client_address
    FROM processes p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.id = ${id}`

    const process = processResult[0];

    if (!process) {
      throw createError({
        statusCode: 404,
        message: 'Processo não encontrado'
      })
    }

    // Get payment history
    const paymentsResult = await sql`
      SELECT *, amount as value_paid, movement_date as payment_date
      FROM financial_movements
      WHERE process_id = ${id} AND type = 'payment'
      ORDER BY movement_date DESC, created_at DESC
    `

    const totalPaid = await sql`
      SELECT
        SUM(amount) as total
      FROM financial_movements
      WHERE process_id = ${id} AND type = 'payment'
    `

    const payments = paymentsResult;

    // Calculate totals

    return {
      success: true,
      data: {
        ...process,
        is_fully_paid: isFullyPaid(Number(process.value_charged), totalPaid[0]!.total),
        payments
      }
    }
})
