import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const search = (query.search as string || "").toLowerCase();
  const offset = (page - 1) * limit;

  try {
    let sql = `
      SELECT id, name, created_at
      FROM offices
    `;
    let countSql = `
      SELECT COUNT(*) as total
      FROM offices
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (search) {
      whereClauses.push("LOWER(name) LIKE ?");
      params.push(`%${search}%`);
    }

    if (whereClauses.length > 0) {
      const whereClause = `WHERE ${whereClauses.join(" AND ")}`;
      sql += whereClause;
      countSql += whereClause;
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

    const totalResult = await db.execute({
      sql: countSql,
      args: params,
    });
    const total = totalResult.rows[0] ? Number(totalResult.rows[0].total) : 0;

    const dataResult = await db.execute({
      sql,
      args: [...params, limit, offset],
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      success: true,
      data: dataResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
