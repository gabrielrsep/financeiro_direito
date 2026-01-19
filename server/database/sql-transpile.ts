import { globSync } from 'glob';
import { readFileSync, writeFileSync } from 'node:fs';
import { splitQuery, sqliteSplitterOptions } from 'dbgate-query-splitter';

if (process.argv[2] === "run") {
  const sqlFiles = sqlTranspile();
  console.log(`SQL transpiled successfully ${sqlFiles.length} files`);
}

function sqlTranspile() {
  const sqlFiles = globSync("server/database/sql/**/*.sql", { nodir: true });

  for (const sqlFile of sqlFiles) {
    const sqlContent = readFileSync(sqlFile, "utf-8");

    const sqlQueries = splitQuery(sqlContent, {
      ...sqliteSplitterOptions,
      ignoreComments: true,
      keepSemicolonInCommands: true
    })

    const sqlContentFormatted = sqlQueries.join("\n");

    const content = `export default \`${sqlContentFormatted}\``

    writeFileSync(sqlFile.replace(".sql", ".ts"), content)
  }
  return sqlFiles
}

export default sqlTranspile