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
      p.id,
      p.client_id,
      p.process_number,
      p.tribunal,
      p.target,
      p.description,
      p.status,
      p.value_charged,
      p.payment_method,
      c.name as client_name,
      c.document as client_document,
      c.contact as client_contact,
      c.address as client_address,
      coalesce(sum(fm.amount), 0) as total_paid
    FROM processes p
    JOIN clients c ON p.client_id = c.id
    left join financial_movements fm on p.id = fm.process_id 
    WHERE p.id = ${id}
    group by p.id, c.id
  `

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
      ORDER BY movement_date DESC, created_at DESC LIMIT 10
    `

    const payments = paymentsResult;

    // Calculate totals

    return {
      success: true,
      data: {
        ...process,
        is_fully_paid: isFullyPaid(Number(process.value_charged), Number(process.total_paid)),
        payments
      }
    }
})
