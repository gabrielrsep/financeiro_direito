import { globSync } from 'glob';
import { readFileSync, writeFileSync } from 'node:fs';
import { splitQuery, sqliteSplitterOptions } from 'dbgate-query-splitter';

function removeComments(sqlContent: string): string {
  return sqlContent.replace(/--.*?\n/g, "");
}

function removeNewLines(sqlContent: string): string {
  return sqlContent.replace(/\n/g, "");
}

if (process.argv[2] === "run") {
  sqlTranspile();
  console.log("SQL transpiled successfully");
}

function sqlTranspile() {
  const sqlFiles = globSync("server/database/sql/**/*.sql", { nodir: true });

  for (const sqlFile of sqlFiles) {
    const sqlContent = readFileSync(sqlFile, "utf-8");

    const sqlQueries = splitQuery(sqlContent, {...sqliteSplitterOptions, ignoreComments: true })

    const sqlContentFormatted = sqlQueries.join(";\n");

    const content = `export default \`${sqlContentFormatted}\``

    writeFileSync(sqlFile.replace(".sql", ".ts"), content)
  }
}

export default sqlTranspile