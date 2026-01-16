import { db } from "../../database/connection";

export default defineEventHandler(async (event) => {
  try {
    const result = await db.execute("SELECT COUNT(*) as count FROM users");
    const count = Number(result.rows[0]?.count || 0);

    return {
      needsSetup: count === 0
    };
  } catch (error) {
    console.error("Error checking setup status:", error);
    return {
      needsSetup: false // Default to false to avoid redirect loops on database errors
    };
  }
});
