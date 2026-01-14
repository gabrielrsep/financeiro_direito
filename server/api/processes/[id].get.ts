import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../database/connection'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do processo é obrigatório'
    })
  }

  try {
    // Busca o processo com dados do cliente
    const process = db.prepare(`
      SELECT 
        p.*,
        c.name as client_name,
        c.document as client_document,
        c.contact as client_contact,
        c.address as client_address
      FROM processes p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).get(id)

    if (!process) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Processo não encontrado'
      })
    }

    // Busca os pagamentos do processo
    const payments = db.prepare(`
      SELECT *
      FROM payments
      WHERE process_id = ?
      ORDER BY due_date ASC, created_at ASC
    `).all(id)

    return {
      success: true,
      data: {
        ...process,
        payments
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro ao buscar detalhes do processo'
    })
  }
})
