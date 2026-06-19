import { neonClient, replaceQuestionMarks } from "../../database/connection";

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

    const totalResult = await neonClient.query(replaceQuestionMarks(countSql), params);

    const total = totalResult[0] ? Number(totalResult[0].total) : 0;

    const dataResult = await neonClient.query(replaceQuestionMarks(sql), [...params, limit, offset]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      success: true,
      data: dataResult,
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
