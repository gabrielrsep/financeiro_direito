import { neonClient } from "../../database/connection";

export default defineEventHandler(async () => {
  try {

    const result = await neonClient`SELECT COUNT(*) as count FROM users`;
    const count = Number(result[0]?.count || 0);

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
