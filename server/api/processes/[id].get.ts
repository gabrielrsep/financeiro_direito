import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../database/connection'
import { isFullyPaid } from '../../util/payment'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID do processo é obrigatório'
    })
  }

  try {
    // Busca o processo com dados do cliente
    const processResult = await db.execute({
      sql: `
        SELECT 
          p.*,
          c.name as client_name,
          c.document as client_document,
          c.contact as client_contact,
          c.address as client_address
        FROM processes p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `,
      args: [id]
    })
    const process = processResult.rows[0];

    if (!process) {
      throw createError({
        statusCode: 404,
        message: 'Processo não encontrado'
      })
    }

    // Get payment history
    const paymentsResult = await db.execute({
      sql: `
        SELECT *, amount as value_paid, movement_date as payment_date
        FROM financial_movements
        WHERE process_id = ? AND type = 'payment'
        ORDER BY movement_date DESC, created_at DESC
      `,
      args: [id]
    });

    const payments = paymentsResult.rows || [];

    // Calculate totals
    const totalPaid = payments.reduce((sum, p: any) => sum + (p.value_paid || 0), 0);

    return {
      success: true,
      data: {
        ...process,
        is_fully_paid: isFullyPaid(Number(process.value_charged), totalPaid),
        payments
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao buscar detalhes do processo'
    })
  }
})
