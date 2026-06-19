import { neonClient as sql } from "~~/server/database/connection";
import { getUser } from "~~/server/util/auth";

export default defineEventHandler(async event => {
  const { user } = await getUserSession(event);
  const officeId = user!.office_id;

  try {

    const statsResult = await sql`
      SELECT
        active_processes,
        active_services,
        monthly_revenue,
        recurrent_revenue,
        pending_expenses
      FROM view_estatisticas_mensais
      WHERE office_id = ${officeId} AND mes_referencia = date_trunc('month', current_timestamp)
    `
    const stats = statsResult[0] || {
      active_processes: 0,
      active_services: 0,
      monthly_revenue: 0,
      recurrent_revenue: 0,
      pending_expenses: 0
    }


    return {
      kpis: {
        activeProcesses: stats.active_processes,
        activeServices: stats.active_services,
        monthlyRevenue: stats.monthly_revenue,
        recurrentRevenue: stats.recurrent_revenue,
        pendingExpenses: stats.pending_expenses,
      }
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
