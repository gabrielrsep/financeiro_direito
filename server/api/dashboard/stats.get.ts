import { db } from "../../database/connection";

export default defineEventHandler(async () => {
  try {
    const totalReceivableResult = await db.execute(`
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
    `);
    const totalReceivable = totalReceivableResult.rows[0];

    const activeProcessesResult = await db.execute("SELECT COUNT(*) as total FROM processes WHERE status = 'Ativo'");
    const activeProcesses = activeProcessesResult.rows[0];

    // Monthly revenue: sum of payments in the current month
    const monthlyRevenueResult = await db.execute(`
      SELECT SUM(value_paid) as total 
      FROM payments 
      WHERE strftime('%m', payment_date) = strftime('%m', 'now') 
      AND strftime('%Y', payment_date) = strftime('%Y', 'now')
    `);
    const monthlyRevenue = monthlyRevenueResult.rows[0];

    // Pending expenses: sum of pending office expenses for the current month
    const pendingExpensesResult = await db.execute(`
      SELECT SUM(amount) as total 
      FROM office_expenses 
      WHERE status = 'Pendente' 
      AND strftime('%m', due_date) = strftime('%m', 'now') 
      AND strftime('%Y', due_date) = strftime('%Y', 'now')
    `);
    const pendingExpenses = pendingExpensesResult.rows[0];

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
        totalReceivable: Number((totalReceivable as any)?.total || 0),
        activeProcesses: Number((activeProcesses as any)?.total || 0),
        monthlyRevenue: Number((monthlyRevenue as any)?.total || 0),
        pendingExpenses: Number((pendingExpenses as any)?.total || 0),
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
