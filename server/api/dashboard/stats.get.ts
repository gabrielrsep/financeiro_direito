import { getFirstRow } from "~~/server/database/utils";
import { db } from "~~/server/database/connection";
import totalReceivableSQL from "~~/server/database/sql/stats/totalReceivable";
import monthlyRevenueSQL from "~~/server/database/sql/stats/monthlyRevenue";

export default defineEventHandler(async () => {
  type Result = {
    total: number;
  };

  try {
    const totalReceivableResult = await db.execute(totalReceivableSQL)
    const totalReceivableApps = getFirstRow<Result>(totalReceivableResult);

    // Calculate Recurrent Receivable
    // 1. Total expected from recurrent clients
    const expectedRecurrentResult = await db.execute("SELECT SUM(recurrence_value) as total FROM clients WHERE is_recurrent = 1 AND deleted_at IS NULL");
    const expectedRecurrent = getFirstRow<Result>(expectedRecurrentResult);

    // 2. Total paid by recurrent clients this month
    const paidRecurrentResult = await db.execute(`
      SELECT SUM(value_paid) as total 
      FROM payments 
      WHERE client_id IS NOT NULL 
      AND strftime('%m', payment_date) = strftime('%m', 'now') 
      AND strftime('%Y', payment_date) = strftime('%Y', 'now')
    `);
    const paidRecurrent = getFirstRow<Result>(paidRecurrentResult);

    const recurrentReceivable = (expectedRecurrent.total || 0) - (paidRecurrent.total || 0);
    const totalReceivable = (totalReceivableApps.total || 0) + (recurrentReceivable > 0 ? recurrentReceivable : 0);

    const activeProcessesResult = await db.execute("SELECT COUNT(*) as total FROM processes WHERE status = 'Ativo'");
    const activeProcesses = getFirstRow<Result>(activeProcessesResult);

    // Monthly revenue: sum of payments in the current month
    const monthlyRevenueResult = await db.execute(monthlyRevenueSQL);
    const monthlyRevenue = getFirstRow<Result>(monthlyRevenueResult)

    // Pending expenses: sum of pending office expenses for the current month
    const pendingExpensesResult = await db.execute(`
      SELECT SUM(amount) as total 
      FROM office_expenses 
      WHERE status = 'Pendente' 
      AND strftime('%m', due_date) = strftime('%m', 'now') 
      AND strftime('%Y', due_date) = strftime('%Y', 'now')
    `);
    const pendingExpenses = getFirstRow(pendingExpensesResult);

    // Recent processes
    const recentProcessesResult = await db.execute(`
      SELECT p.*, c.name as client_name 
      FROM processes p 
      JOIN clients c ON p.client_id = c.id 
      ORDER BY p.created_at DESC 
      LIMIT 5
    `);
    const recentProcesses = recentProcessesResult.rows;
    

    // Recent payments
    const recentPaymentsResult = await db.execute(`
      SELECT py.*, p.process_number, c.name as client_name 
      FROM payments py 
      JOIN processes p ON py.process_id = p.id 
      JOIN clients c ON p.client_id = c.id 
      ORDER BY py.created_at DESC 
      LIMIT 5
    `);
    const recentPayments = recentPaymentsResult.rows;

    return {
      kpis: {
        totalReceivable: totalReceivable,
        activeProcesses: activeProcesses.total || 0,
        monthlyRevenue: Number((monthlyRevenue as any)?.total || 0),
        recurrentRevenue: Number((paidRecurrent as any)?.total || 0),
        pendingExpenses: Number((pendingExpenses as any)?.total || 0),
      },
      recentProcesses,
      recentPayments
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
