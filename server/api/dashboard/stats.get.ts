import { getFirstRow } from "~~/server/database/utils";
import { db } from "~~/server/database/connection";
import monthlyRevenueSQL from "~~/server/database/sql/stats/monthlyRevenue";
import { getUser } from "~~/server/util/auth";

export default defineEventHandler(async event => {
  type Result = {
    total: number;
  };

  const user = await getUser(event);
  const officeId = user!.office_id;

  try {
    // 2. Total paid by recurrent clients this month
    const paidRecurrentResult = await db.execute(`
      SELECT SUM(amount) as total 
      FROM financial_movements f JOIN clients c ON f.client_id = c.id
      WHERE f.type = 'payment' 
      AND f.client_id IS NOT NULL
      AND c.office_id = ?
      AND strftime('%m', f.movement_date) = strftime('%m', 'now') 
      AND strftime('%Y', f.movement_date) = strftime('%Y', 'now')
    `, [officeId]);
    const paidRecurrent = getFirstRow<Result>(paidRecurrentResult)

    const activeProcessesResult = await db.execute("SELECT COUNT(*) as total FROM processes WHERE status = 'Ativo' AND deleted_at IS NULL AND office_id = ?", [officeId]);
    const activeProcesses = getFirstRow<Result>(activeProcessesResult)

    // Get service metrics
    const activeServicesResult = await db.execute("SELECT COUNT(*) as total FROM services WHERE status = 'Ativo' AND deleted_at IS NULL AND office_id = ?", [officeId]);
    const activeServices = getFirstRow<Result>(activeServicesResult)

    // Receivable from services: sum of (value_charged - payments) for active services in the current month
    const servicesReceivableResult = await db.execute(`
    SELECT 
      SUM(saldo_restante) as total_geral
    FROM (
      SELECT
          s.value_charged - COALESCE(SUM(fm.amount), 0) as saldo_restante
      FROM
          services s
      JOIN financial_movements fm ON
          fm.service_id = s.id
      WHERE
          s.deleted_at IS NULL
          AND s.status = 'Ativo'
          AND s.office_id = ?
          AND fm."type" = 'payment'
          AND strftime('%m', fm.movement_date) = strftime('%m', 'now')
          AND strftime('%Y', fm.movement_date) = strftime('%Y', 'now')
      GROUP BY 
          s.id, s.value_charged
    ) saldos_por_servico;
    `, [officeId]);
    const servicesReceivable = getFirstRow<Result>(servicesReceivableResult)

    // Monthly revenue: sum of payments in the current month
    const monthlyRevenueResult = await db.execute(monthlyRevenueSQL, [officeId, officeId, officeId]);
    const monthlyRevenue = getFirstRow<Result>(monthlyRevenueResult)

    // Pending expenses: sum of pending office expenses for the current month
    const pendingExpensesResult = await db.execute(`
      SELECT SUM(amount) as total 
      FROM office_expenses 
      WHERE
      status = 'Pendente'
      AND deleted_at IS NULL
      AND office_id = ? 
      AND strftime('%m', due_date) = strftime('%m', 'now')
      AND strftime('%Y', due_date) = strftime('%Y', 'now')
    `, [officeId]);
    const pendingExpenses = getFirstRow(pendingExpensesResult)

    const servicesReceivableValue = Number((servicesReceivable as any)?.total || 0)

    return {
      kpis: {
        totalReceivable: servicesReceivableValue,
        activeProcesses: activeProcesses.total || 0,
        activeServices: activeServices.total || 0,
        servicesReceivable: servicesReceivableValue,
        monthlyRevenue: Number((monthlyRevenue as any)?.total || 0),
        recurrentRevenue: Number((paidRecurrent as any)?.total || 0),
        pendingExpenses: Number((pendingExpenses as any)?.total || 0),
      }
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
