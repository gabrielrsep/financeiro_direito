import { readFileSync } from "fs";
import type { Client, ResultSet } from "@libsql/client";
import { join } from "path";


export function runSQLFile(db: Client, filePath: string) {
    const p = join('server/database/sql', filePath)
    const sqlStatement = readFileSync(p).toString();
    return db.execute(sqlStatement)
}

export function getFirstRow<T>(arg: ResultSet[] | ResultSet) {
    const result = Array.isArray(arg) ? arg : [arg];
    return result[0].rows[0] as T;
}