import { db } from "../../database/connection";

export default defineEventHandler(async () => {
  try {
    const totalReceivable = db.prepare(`
      SELECT
	(
	SELECT
		SUM(value_charged)
	FROM
		processes
	WHERE
		payment_method = 'em_conta') 
    - 
    (
	SELECT
		SUM(pa.value_paid)
	FROM
		payments pa
	INNER JOIN processes pr ON
		pa.process_id = pr.id
	WHERE
		pr.payment_method = 'em_conta') 
AS total;
    `).get() as { total: number };
    console.log(totalReceivable);

    const activeProcesses = db.prepare("SELECT COUNT(*) as total FROM processes WHERE status = 'Ativo'").get() as { total: number };

    // Monthly revenue: sum of payments in the current month
    const monthlyRevenue = db.prepare(`
      SELECT SUM(value_paid) as total 
      FROM payments 
      WHERE strftime('%m', payment_date) = strftime('%m', 'now') 
      AND strftime('%Y', payment_date) = strftime('%Y', 'now')
    `).get() as { total: number };

    // Pending expenses: sum of pending office expenses for the current month
    const pendingExpenses = db.prepare(`
      SELECT SUM(amount) as total 
      FROM office_expenses 
      WHERE status = 'Pendente' 
      AND strftime('%m', due_date) = strftime('%m', 'now') 
      AND strftime('%Y', due_date) = strftime('%Y', 'now')
    `).get() as { total: number };

    // Recent processes
    const recentProcesses = db.prepare(`
      SELECT p.*, c.name as client_name 
      FROM processes p 
      JOIN clients c ON p.client_id = c.id 
      ORDER BY p.created_at DESC 
      LIMIT 5
    `).all();

    // Recent payments
    const recentPayments = db.prepare(`
      SELECT py.*, p.process_number, c.name as client_name 
      FROM payments py 
      JOIN processes p ON py.process_id = p.id 
      JOIN clients c ON p.client_id = c.id 
      ORDER BY py.created_at DESC 
      LIMIT 5
    `).all();

    return {
      kpis: {
        totalReceivable: totalReceivable?.total || 0,
        activeProcesses: activeProcesses?.total || 0,
        monthlyRevenue: monthlyRevenue?.total || 0,
        pendingExpenses: pendingExpenses?.total || 0,
      },
      recentProcesses,
      recentPayments
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
