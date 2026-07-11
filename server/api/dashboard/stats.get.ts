import { neonClient as sql } from "~~/server/database/connection";

export default defineEventHandler(async event => {
  const { user } = await getUserSession(event);
  const officeId = user!.office_id;

  try {
    const statsResult = await sql`
      SELECT
        monthly_revenue,
        recurrent_revenue,
        pending_expenses
      FROM view_estatisticas_mensais
      WHERE office_id = ${officeId} AND mes_referencia = date_trunc('month', current_timestamp)
    `

    const activesResult = await sql`
      with
        active_services as (
          select
            count(s.id) total
          from services s
          where
            s.status = 'Ativo' and
            s.deleted_at is null and
            s.office_id = ${officeId}
        ),
        active_processes as (
          select
            count(p.id) total
          from processes p
          where
            p.status = 'Ativo' and
            p.deleted_at is null and
            p.office_id = ${officeId}
        )
      select s.total sevices, p.total as processes from active_services s, active_processes p;
    `
    return {
      active_processes: activesResult[0]?.processes || 0,
      active_services: activesResult[0]?.sevices || 0,
      ...statsResult[0]
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
