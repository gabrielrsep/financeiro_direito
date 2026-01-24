import { ResultSet } from "@libsql/client";

export function getFirstRow<T>(result: ResultSet): T {
  return (result.rows[0] ?? {}) as T;
}
